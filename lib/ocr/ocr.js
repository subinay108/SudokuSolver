// load the tf module asynchronously
let model;
(async () => {
    const modelURL = 'lib/ocr/output/model.json';

    model = await tf.loadLayersModel(modelURL);
    console.log('Model loaded successfully');
})();

function findPuzzle(image){
    let gray = new cv.Mat();

    // for converting image to grayscale
    cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY, 0);

    // apply gaussian blur
    let blur = new cv.Mat();
    let ksize = new cv.Size(7, 7);
    cv.GaussianBlur(gray, blur, ksize, 0, 0, cv.BORDER_DEFAULT);

    // apply adaptive thresholding
    let thresh = new cv.Mat();
    cv.adaptiveThreshold(blur, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

    // inverting
    cv.bitwise_not(thresh, thresh);

    // finding contours
    let cnts = new cv.MatVector();
    let hier = new cv.Mat();
    cv.findContours(thresh, cnts, hier, cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE);

    // find the largest rectangle contour
    let largestContour;
    let largestArea = 0;
    for(let i = 0; i < cnts.size(); i++){
        const contour = cnts.get(i);
        const area = cv.contourArea(contour, false);
        if(area > largestArea){
            largestArea = area;
            largestContour = contour;
        }
    }
    
    // Apply four-point perspective transformation if the largest contour is found
    if (largestContour) {
        // Get the convex hull of the contour
        const hull = new cv.Mat();
        cv.convexHull(largestContour, hull, false, true);

        // Approximate the convex hull to get the corner points
        const epsilon = 0.02 * cv.arcLength(hull, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(hull, approx, epsilon, true);

        // Extract the corner points of the convex hull
        const hullPoints = [];
    
        for (let i = 0; i < approx.data32S.length; i += 2) {
            // const point = { x: approx.data32S[i], y: approx.data32S[i + 1] };
            const point = [approx.data32S[i], approx.data32S[i + 1]];
            hullPoints.push(point);
        }

        // Release memory used by the hull and approx
        hull.delete();
        approx.delete();
        
        // Ensure we have exactly 4 corner points
        if(hullPoints.length === 4){
            const imageWidth = 450; // Replace with your desired width
            const imageHeight = 450; // Replace with your desired height
            // console.log(imageHeight, imageWidth);
            // Define the destination points for the perspective transformation
            const dstPoints = [
            [0, 0],                    // Top-left
            [imageWidth, 0],             // Top-right
            [imageWidth, imageHeight],      // Bottom-right
            [0, imageHeight]             // Bottom-left
            ];

            const asliHul = new Array(4).fill(0);
            hullPoints.sort((m, n) => m[0] - n[0]);
            if(hullPoints[0][1] > hullPoints[1][1]){
                asliHul[0] = hullPoints[1];
                asliHul[3] = hullPoints[0];
            }
            else{
                asliHul[0] = hullPoints[0];
                asliHul[3] = hullPoints[1];
            }
            if(hullPoints[2][1] > hullPoints[3][1]){
                asliHul[1] = hullPoints[3];
                asliHul[2] = hullPoints[2];
            }
            else{
                asliHul[1] = hullPoints[2];
                asliHul[2] = hullPoints[3];
            }

            // Perform the four-point perspective transformation
            const dstWidth = imageWidth;
            const dstHeight = imageHeight;
            const dstMat = cv.matFromArray(dstHeight, dstWidth, cv.CV_8UC3, [0, 0, 0]);
            const srcMatPoints = new cv.Mat(asliHul.length, 1, cv.CV_32FC2);
            const dstMatPoints = new cv.Mat(4, 1, cv.CV_32FC2);
            // console.log('dstMatPoints', dstMatPoints);
            for (let i = 0; i < asliHul.length; i++) {
                srcMatPoints.data32F[i * 2] = asliHul[i][0];
                srcMatPoints.data32F[i * 2 + 1] = asliHul[i][1];
                dstMatPoints.data32F[i * 2] = dstPoints[i][0];
                dstMatPoints.data32F[i * 2 + 1] = dstPoints[i][1];
            }
            const perspectiveTransformMatrix = cv.getPerspectiveTransform(srcMatPoints, dstMatPoints);

            cv.warpPerspective(gray, dstMat, perspectiveTransformMatrix, new cv.Size(dstWidth, dstHeight));
            
            // Free memory
            srcMatPoints.delete();
            dstMatPoints.delete();
            perspectiveTransformMatrix.delete();
            gray.delete();
            thresh.delete();
            blur.delete();

            return dstMat;

        } else{
        console.log('Invalid number of contour points. Expected 4 points');
      }
    }
}

function extractDigit(cell) {
    // Apply automatic thresholding to the cell and then clear any
    // connected borders that touch the border of the cell
    const thresh = new cv.Mat();
    cv.threshold(cell, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  
    const cleared = clearBorder(thresh);
  
    // Find contours in the thresholded cell
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(cleared, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    hierarchy.delete();
  
    // If no contours were found, then this is an empty cell
    if (contours.size() === 0) {
      return null;
    }
  
    // Otherwise, find the largest contour in the cell and create a mask for the contour
    let maxContourIndex = 0;
    let maxContourArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const contourArea = cv.contourArea(contours.get(i));
      if (contourArea > maxContourArea) {
        maxContourIndex = i;
        maxContourArea = contourArea;
      }
    }
    const mask = new cv.Mat.zeros(cleared.rows, cleared.cols, cv.CV_8U);
    cv.drawContours(mask, contours, maxContourIndex, new cv.Scalar(255), cv.FILLED);
    
    // Compute the percentage of masked pixels relative to the total area of the image
    const percentFilled = cv.countNonZero(mask) / (cleared.cols * cleared.rows);
    
    // If less than 3% of the mask is filled, then we are looking at noise and can safely ignore the contour
    if (percentFilled < 0.02) {
      return null;
    }
    
    // Apply the mask to the thresholded cell
    const digit = new cv.Mat();
    cv.bitwise_and(thresh, thresh, digit, mask);
  
    // Return the digit to the calling function
    return digit;
}
    
function clearBorder(image, borderSize = 1) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(image, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let clearedImage = new cv.Mat();
    image.copyTo(clearedImage);

    let contoursToDraw = new cv.MatVector(); // Create a MatVector for contours

    for (let i = 0; i < contours.size(); i++) {
        let contour = contours.get(i);
        let rect = cv.boundingRect(contour);
        let x = rect.x;
        let y = rect.y;
        let w = rect.width;
        let h = rect.height;

        if (
            x < borderSize ||
            y < borderSize ||
            x + w > image.cols - borderSize ||
            y + h > image.rows - borderSize
        ) {
            contoursToDraw.push_back(contour); // Push contour to MatVector
        }

        contour.delete(); // Delete the contour after using it
    }

    cv.drawContours(clearedImage, contoursToDraw, -1, new cv.Scalar(0, 0, 0), -1);

    contours.delete();
    hierarchy.delete();
    contoursToDraw.delete(); // Delete the MatVector

    return clearedImage;
}
  
function detectText(image){
    // Resize the image
    const resizedImage = new cv.Mat();
    const targetWidth = 600;
    const aspectRatio = image.cols / image.rows;
    const targetHeight = Math.floor(targetWidth / aspectRatio);
    cv.resize(image, resizedImage, new cv.Size(targetWidth, targetHeight));
    image.delete();

    // find the puzzle in the image and then
    const warped = findPuzzle(resizedImage);
    if(warped == undefined){
        return undefined;
    }
    resizedImage.delete();
    
    // Initialize an empty 9x9 Sudoku board
    let board = new Array(9).fill(null).map(() => new Array(9).fill(0));

    // Calculate step size for cell locations
    let stepX = Math.floor(warped.cols / 9);
    let stepY = Math.floor(warped.rows / 9);

    // Loop over the grid locations
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            // Calculate cell coordinates
            let startX = x * stepX;
            let startY = y * stepY;

            // Crop the cell from the image and extract the digit
            // Create a new cv.Mat that represents the cell
            // console.log(startX, startY);
            const cellRect = new cv.Rect(startX, startY, stepX, stepY);
            const cell = warped.roi(cellRect);
            // Now "cell" contains the extracted region of interest from the "warped"
            // extract the digit from the cell
            const digit = extractDigit(cell);
            
            // delete the "cell" Mat
            cell.delete();

            // Verify if the digit is not empty
            if (digit !== null) {
                // Resize and preprocess the digit for classification
                const roi = new cv.Mat();
                cv.resize(digit, roi, new cv.Size(28, 28));

                // Convert the Mat to a Float32Array and scale to [0, 1] range
                const float32Array = new Float32Array(28 * 28);
                for (let i = 0; i < 28; i++) {
                    for (let j = 0; j < 28; j++) {
                        float32Array[i * 28 + j] = roi.ucharPtr(i, j)[0] / 255;
                    }
                }

                // Dispose of Mats when you're done using them
                roi.delete();

                // Create a TensorFlow.js Tensor from the Float32Array
                const tensor = tf.tensor(float32Array, [1, 28, 28, 1]);

                // Classify the digit
                const pred = model.predict(tensor).argMax(1).dataSync()[0];
                tensor.dispose();

                // Update the Sudoku board with the prediction
                board[y][x] = pred;
            }
        }
    }

    // return the board Array
    return board;  
}

