import {AppDirector} from "./AppDirector.js";

//Make this an AbstractEditor and Interface different editors -
// Monaco: General Code
// DTL: Iris Transforms
// BPL: Iris Business Processing

export class Editor {

    constructor(doc) {
        this.hasChanged = false;
        this.doc = doc;
        this.mounted = false;
        this.el = document.createElement('div');
        this.el.classList.add('editor');

        if (doc) {
            this.createMonacoEditor(doc);
        } else {
            //DTL EDITOR HERE
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
        this.editor.getModel().setEOL(0);
        this.editor.getModel().onDidChangeContent( ev => this.hasChanged = true )
        this.editor.onDidChangeCursorPosition( ev => AppDirector.set("Message.CursorPosition", ev.position) );
        this.editor.onDidFocusEditorText( ev => AppDirector.set("Message.EditorDidGetFocus", {"ev":ev,"tabLayout":this.el.parentElement.parentElement}));
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