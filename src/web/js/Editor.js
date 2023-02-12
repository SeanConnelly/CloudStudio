import {AppDirector} from "./AppDirector.js";
import {Document} from "./iris/Document.js";

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
        window.setTimeout( () => { this.enhanceDTLEditorStyle(); },1000)
    }

    enhanceDTLEditorStyle() {
        //remove inner overflow to clean up scrollbar real estate
        let iframeBody=this.el.children[0].contentWindow.document.body;
        let innerSVG=iframeBody.getElementsByTagName('embed')[0].getSVGDocument().firstChild;

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

        //inject css to highlight active and hidden lines
        let styleElement = document.createElement('style')
        styleElement.innerHTML = `
            .DTLActionSelected {
                stroke: rgb(5,205,235) !important;
            }
        `
        innerSVG.insertBefore(styleElement,innerSVG.firstChild);

    }

    reload() {
        //window.setTimeout( () => {
            this.doc.reload().then( () => {
                this.editor.getModel().setValue(this.doc.content);
            })
        //},1000)
    }

    save(forceSave = false) {
        //SAVE DTL
        if (this.doc.isDTL) {
            //hijack the basic alert function, capture its text and display to the output window (applied to compile as well)
            this.el.children[0].contentWindow.window.alert = function(text) {
                AppDirector.set('Message.Console',{
                    title: 'save',
                    state: 'info',
                    text: text
                });
            }
            this.el.children[0].contentWindow.window.zenPage.studioMode=false;
            this.el.children[0].contentWindow.window.zenPage.saveDT(false);
        } else {
            if ((this.hasChanged === false) && (forceSave === false)) {
                AppDirector.set('Message.Console',{
                    title: 'save',
                    state: 'info',
                    text: 'no changes'
                });
            } else {
                this.doc.content = this.editor.getModel().getValue();
                return this.doc.save()
                    .then( res => res.json())
                    .then( data => {
                        AppDirector.set('Message.Console',{
                            title: 'save',
                            state: 'info',
                            text: this.doc.name + ' saved'
                        });
                        this.hasChanged = false;
                    })
                    .catch( err => { AppDirector.set('Message.Console',err,false) });
            }
        }
    }

    compile() {
        if (this.doc.isDTL) {
            this.save(true);
            window.setTimeout( () => {
                this.compileDTL()
            })
        } else {
            this.save(true)
                .then( () => this.doc.compile())
                .then( res => res.json())
                .then( data => {
                    let msg = data.console.join('<br>')
                        .replace('ERROR','<span style="color:red;">ERROR</span>')
                        .replace('Compilation finished successfully','<span style="color:green;">Compilation finished successfully</span>')
                    AppDirector.set('Message.Console',msg,false)
                    this.reload();
                })
                .catch( err => AppDirector.set('Message.Console',err,false) );
        }
    }

    compileDTL() {
        this.save(true);
        this.doc.compile()
            .then( res => res.json())
            .then( data => {
                let msg = data.console.join('<br>')
                    .replace('ERROR','<span style="color:red;">ERROR</span>')
                    .replace('Compilation finished successfully','<span style="color:green;">Compilation finished successfully</span>')
                AppDirector.set('Message.Console', {
                    html: msg
                },false);
                //launch DTL test window
                this.el.children[0].contentWindow.window.document.querySelector('input[value="Test"]').click();
                //wait for DTL test window to fully render
                window.setTimeout( () => {
                    //trigger the DTL test button
                    this.el.children[0].contentWindow.window.document.getElementsByTagName('iframe')[0].contentDocument.querySelector('input[value="Test"]').click();
                    //wait for the DTL test to execute and return the result
                    window.setTimeout( () => {
                        //extract the results from the test window
                        let spans = this.el.children[0].contentWindow.window.document.getElementsByTagName('iframe')[0].contentDocument.getElementsByTagName('span');
                        let span = spans[spans.length-1];
                        let tr = span.closest('tr').cloneNode(true);
                        tr.style.color = 'var(--appTextColorFive)';
                        let pre = tr.querySelector('pre');
                        if (pre !== null) {
                            let html = pre.innerHTML;
                            let text = pre.innerText;
                            //if its XML then lets add some formatting to make the XML values pop
                            if (text.charAt(0) === '<') {
                                tr.querySelector('pre').innerHTML = html.replaceAll(/(&gt;)(.*)(&lt;\/)/g,"$1<span class='primary-color''>$2</span>$3")
                            }
                        }
                        //send a clone of the results to the message console
                        AppDirector.set('Message.Console',{
                            title: 'save',
                            state: 'info',
                            dtlResult: tr
                        });
                        //now close the DTL test window
                        this.el.children[0].contentWindow.window.document.getElementsByTagName('iframe')[0].contentDocument.querySelector('input[value="Close"]').click();
                    },1000)
                },1000)

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

    selectAll() {
        const range = this.editor.getModel().getFullModelRange();
        this.editor.setSelection(range);
    }

    undo() {
        this.editor.getModel().undo();
    }

    redo() {
        this.editor.getModel().redo();
    }

    cut() {
        this.editor.focus();
        document.execCommand('cut');
    }

    copy() {
        this.editor.focus();
        this.editor.trigger('source','editor.action.clipboardCopyAction');
    }

    paste() {
        this.editor.focus();
        this.editor.trigger('source','editor.action.clipboardPasteAction');
    }

    delete() {
        //
    }
}