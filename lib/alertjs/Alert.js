/**
 * Alert class responsible for creating app Alerts.
 */
class $Alert {

    /**
     * Create a new Alert Class instance.
     *
     * @param { Object } config Alert config.
     */
    constructor(config = {}) {
        // A DOM element in which an Alert should appear.
        this.container = document.querySelector(config.container ?? 'body')

        // An Alert type.
        this.type = config.type;

        // An Alert message.
        this.message = config.message;

        // An Alert duration.
        this.duration = (config.duration ?? 5) * 1000;

        // Determine whether an Alert should be removed from the DOM.
        this.destroy = config.destroy ?? true;

        // Determine whether an Alert should expire/auto-close.
        this.expires = config.expires ?? true;

        // Determine whether an Alert should have a progress bar.
        this.withProgress = config.withProgress ?? false;

        // Determine whether an Alert should have an info icon.
        this.info = config.info ?? true;

        // Determine whether an Alert should have a close icon.
        this.close = config.close ?? true;

        // An Alert intervals for 'close' and 'progress'.
        this.intervals = {
            close   : this.expires ? setTimeout(this.#closeAlert.bind(this), this.duration) : null,
            progress: setInterval(this.#progress.bind(this), this.duration / 100),
        }

        this.#build();
        this.#addSelectors();
        this.#addListeners();
    }

    /**
     * Build an Alert.
     *
     * @returns { HTMLElement }
     */
    #build() {
        let alert = this.#buildAlertContainer()
        let message = this.#buildAlertMessage()
        let info = this.#buildInfoIcon();
        let close = this.#buildCloseIcon();
        let progress = this.#buildProgressBar()

        alert.append(info, message, close, progress);

        this.alert = alert;

        this.container.append(alert);
    }

    /**
     * Move Alert progress bar.
     */
    #progress() {
        if (this.progressBar && this.expires) {
            if (this.progressBar.value >= 100) {
                this.#closeAlert.bind(this);
                clearInterval(this.intervals.progress);
            } else {
                this.progressBar.value++;
            }
        }
    }

    /**
     * Close Alert message.
     */
    #closeAlert() {
        // If progress bar exists, set its value to 100, effectively completing the progress.
        if (this.progressBar && this.expires) {
            this.progressBar.value = 100;
        }

        // Clear Alert Close interval.
        clearInterval(this.intervals.close);

        // Close Alert message.
        setTimeout(() => this.alert.classList.replace('alert-is-open', 'alert-is-closed'), this.expires ? 500 : 0);

        // Remove an Alert message from the DOM.
        if (this.destroy) {
            setTimeout(() => this.alert.parentElement?.removeChild(this.alert), this.expires ? 1000 : 500);
        }
    }

    /**
     * Add Alert Query Selectors.
     */
    #addSelectors() {
        this.button = this.alert.querySelector('.alert__close') ?? this.button;
        this.progressBar = this.alert.querySelector('.alert__progress');
    }

    /**
     * Add Alert Event Listeners.
     */
    #addListeners() {
        this.button?.addEventListener('click', this.#closeAlert.bind(this));
    }

    /**
     * Build an Alert container.
     *
     * @return { HTMLElement }
     */
    #buildAlertContainer() {
        return this.#createElement('div', {
            class: 'alert alert-' + this.type + ' alert-is-open',
            role : 'alert',
        });
    }

    /**
     * Build an Alert message.
     *
     * @return { HTMLElement }
     */
    #buildAlertMessage() {
        return this.#createElement('p', {
            class: 'alert__message',
            text : this.message,
        });
    }

    /**
     * Build an Alert Progress Bar.
     *
     * @return { HTMLElement|String }
     */
    #buildProgressBar() {
        if (!this.withProgress) {
            return ''
        }

        return this.#createElement('progress', {
            class: 'alert__progress',
            value: 0,
            max  : 100,
        });
    }

    /**
     * Build an Alert Info icon.
     *
     * @return { HTMLElement|String }
     */
    #buildInfoIcon() {
        switch (typeof this.info) {
            case 'boolean':
                if (!this.info) {
                    return '';
                }

                return this.#toHTML('<svg aria-hidden="true" class="alert__info" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>');
            case 'string':
                return this.#toHTML(`<span class="alert__info">${this.info}</span>`)
        }
    }

    /**
     * Build an Alert Close icon.
     *
     * @return { HTMLElement|String }
     */
    #buildCloseIcon() {
        switch (typeof this.close) {
            case 'boolean':
                if (!this.close) {
                    return '';
                }

                return this.#toHTML('<button class="alert__close" role="button"><svg aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button>')

            case 'string':
                this.button = this.#toHTML(`('<button class="alert__close" role="button">${this.close}</button>`)

                return this.button;
        }
    }

    /**
     * Create an HTML element.
     *
     * @param { String } tag The tag of an element.
     * @param { Object } attributes Element attributes.
     *
     * @returns { HTMLElement }
     */
    #createElement(tag, attributes = {}) {
        let element = document.createElement(tag);

        for (let attribute in attributes) {
            if (attribute === 'text') {
                element.innerHTML = attributes[attribute];

                continue;
            }

            element.setAttribute(attribute, attributes[attribute]);
        }

        return element;
    }

    /**
     * Convert a String to HTML element.
     *
     * @param { Object } string HTML string.
     *
     * @returns { HTMLElement }
     */
    #toHTML(string) {
        let pattern = /(?!<!DOCTYPE)<([^\s>]+)(\s|>)+/;
        let tag = string.match(pattern)[1];
        let HTML = document.createElement('html');
        let DOM = document.createElement(tag);
        HTML.append(DOM);
        DOM.outerHTML = string;

        return tag === 'html' ? HTML : HTML.querySelector(tag);
    }
}

if (typeof exports != 'undefined') {
    module.exports = Alert = $Alert
} else {
    window.Alert = $Alert;
}