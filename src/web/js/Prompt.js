import {AppDirector} from "./AppDirector.js";

const $div = (...cl) => { let div = document.createElement('div'); if (cl) div.classList.add(...cl); return div}

export class PromptBox {

    constructor(title,extension,docType) {
        this.el=$div();
        this.docType=docType;
        this.extension=extension;
        this.el.innerHTML = this.make(title,extension);
        document.body.appendChild(this.el);
        this.el.querySelector('#promptBoxOKButton').addEventListener('click', ev => this.onPromptBoxOKButton());
        this.el.querySelector('#promptBoxCancelButton').addEventListener('click', ev => this.onPromptBoxCancelButton());
        this.el.querySelector('#newItemName').focus();
    }

    onPromptBoxOKButton() {
        let newItemName = this.el.querySelector('#newItemName').value;
        AppDirector.set('Action.MakeNew',{"name":newItemName,"type":this.extension,"docType":this.docType});
        this.el.remove();
    }

    onPromptBoxCancelButton() {
        this.el.remove();
    }

    make(title,extension) {
        return `
            <div class="fit flex-row prompt-box">
                <div class="flex-1"></div>
                <div class="flex-col">
                    <div class="flex-1"></div>
                    <div class="prompt-box--panel">
                        <div class="prompt-box--title">${title}</div>
                        <div class="prompt-box--body">
                            <input class="prompt-box--input" id="newItemName">&nbsp;.${extension}
                        </div>
                        <div class="prompt-box--footer flex-row">
                            <div class="flex-1"></div>
                            <div>
                                <button class="prompt-box--button" onclick="CloudStudioDirector.set('Action.NewOK','')" id="promptBoxOKButton">OK</button>
                                <button class="prompt-box--button" onclick="CloudStudioDirector.set('Action.NewCancel','')" id="promptBoxCancelButton">Cancel</button>
                            </div>
                        </div>                                                
                    </div>
                    <div class="flex-1"></div>
                </div>
                <div class="flex-1"></div>
            </div>
        `
    }

}