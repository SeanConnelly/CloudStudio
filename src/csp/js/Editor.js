import {AppDirector} from "./AppDirector.js";

const $div = (...cl) => { let div = document.createElement('div'); if (cl) div.classList.add(...cl); return div}

//Make this an AbstractEditor and Interface different editors -
// Monaco: General Code
// DTL: Iris Transforms
// BPL: Iris Business Processing

export class Editor {

    constructor(doc) {
        this.hasChanged = false;
        this.doc = doc;
        this.mounted = false;
        this.el = $div('editor');
        this.type = undefined;

        if (doc.isDTL) {
            //todo: simple POC to load DTL into editor, replace with a dual loading solution
            this.createDTLEditor(doc);
        } else {
            this.createMonacoEditor(doc);
        }

    }

    createMonacoEditor(doc) {
        let themeName = (AppDirector.get('Model.Appearance') === 'light' ? 'vs' : 'vs-dark')
        this.editor = monaco.editor.create(this.el,{
            value: doc.content,
            language: doc.language,
            theme: themeName,
            automaticLayout: true,
            minimap: {'enabled' : AppDirector.get('Model.MiniMap') },
            lineNumbers: AppDirector.get('Model.LineNumbers')
        })
        this.type='monaco';
        this.editor.getModel().setEOL(0);
        this.editor.getModel().onDidChangeContent( ev => {this.hasChanged = true; } )
        this.editor.onDidChangeCursorPosition( ev => AppDirector.set("Message.CursorPosition", ev.position) );
        this.editor.onDidFocusEditorText( ev => AppDirector.set("Message.EditorDidGetFocus", {"ev":ev,"tabLayout":this.el.parentElement.parentElement}));  //make grand-parent a named prop of this
    }

    createDTLEditor(doc) {
        let nameParts=doc.name.split('.')
        nameParts.pop();
        nameParts.push('dtl');
        let name=nameParts.join('.');
        this.el.innerHTML=`
            <iframe style="width:100%;height:100%;overflow:hidden;" src="EnsPortal.DTLEditor.zen?DT=${name}&STUDIO=1"></iframe>
        `
        //this.el.children[0].style.zoom = '0.75';
        window.setTimeout( () => {
            //remove inner overflow to clean up scrollbar real estate
            let iframeBody=this.el.children[0].contentWindow.document.body;

            //scale experiments
            //iframeBody.style.transform='scale(0.7)';

            iframeBody.style.overflow = 'hidden';
            //reduce size of images
            let imgs = iframeBody.querySelectorAll('img');
            for (let i=0; i<imgs.length; i++) {
                let img = imgs[i];
                img.style.maxWidth = '16px';
                img.style.maxHeight = '16px';
            }
            //reduce size of ribbon
            let ribbon = iframeBody.querySelector('.toolRibbon');
            ribbon.style.height = '26px';
            ribbon.firstElementChild.style.height = '26px';
            //force resize
            this.el.children[0].contentWindow.window.dispatchEvent(new Event('resize'));
        },1000)
    }

    save(forceSave = false) {
        if ((this.hasChanged === false) && (forceSave === false)) {
            AppDirector.set('Message.Console','Save not required, no changes made.');
            return;
        }
        this.doc.content = this.editor.getModel().getValue();
        return this.doc.save()
            .then( res => res.json())
            .then( data => {
                AppDirector.set('Message.Console','<br>' + this.doc.name + ' saved.',false);
                this.hasChanged = false;
            })
            .catch( err => { AppDirector.set('Message.Console',err,false) });
    }

    compile() {
        this.save(true)
            .then( () => this.doc.compile())
            .then( res => res.json())
            .then( data => {
                let msg = data.console.join('<br>')
                    .replace('ERROR','<span style="color:red;">ERROR</span>')
                    .replace('Compilation finished successfully','<span style="color:green;">Compilation finished successfully</span>')
                AppDirector.set('Message.Console',msg,false)

            })
            .catch( err => AppDirector.set('Message.Console',err,false) );
    }

    updateOptions(options) {
        this.editor.updateOptions(options)
    }

    showLineNumbers(isOnOrOff) {
        this.editor.updateOptions({lineNumbers: isOnOrOff})
    }

    showMiniMap(isEnabled) {
        this.editor.updateOptions({minimap: {'enabled' : isEnabled}});
    }

    setTheme(themeName) {
        this.editor.updateOptions({theme:themeName});
    }

    setThemeLight() {
        this.editor.updateOptions({theme:'vs'});
    }

    setThemeDark() {
        this.editor.updateOptions({theme:'vs-dark'});
    }

    mount(el) {
        if (this.mounted) this.el = this.parentEl.removeChild(this.el)
        this.parentEl = el;
        this.parentEl.appendChild(this.el);
        this.mounted = true;
    }

    show() {
        this.el.classList.remove('hide')
    }

    hide() {
        this.el.classList.add('hide')
    }

    close() {
        this.editor.destroy();
        this.editor.container.remove();
    }
}