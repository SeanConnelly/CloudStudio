export class AppDirector {

    static data = {};
    static subs = {};
    static index = 0;

    static exists(key) {
        return (AppDirector.data[key] !== undefined)
    }

    static get(key) {
        return AppDirector.data[key];
    }

    static init(key,value,persist = false) {
        if (AppDirector.exists(key)) return;
        AppDirector.data[key] = value;
        if (persist) localStorage.setItem(key, value);
    }

    static toggle(key) {
        let v1 = AppDirector.get(key);
        let v2 = undefined;
        if (v1 === 'on') v2 = 'off';
        if (v1 === 'off') v2 = 'on';
        if ((v1 === true) || (v1 === 'true')) v2 = false;
        if ((v1 === false) || (v1 === 'false')) v2 = true;
        if (v2 === undefined) console.log('Unable to toggle inbound value = ',v1);
        AppDirector.set(key,v2)
        return v2;
    }

    static request(key,value,persist = false,blur = false) {
        AppDirector.set(key,value,persist,blur)
    }

    static set(key,value = "",persist = true,blur = false) {
        if (blur) document.activeElement.blur();
        if (key !== 'Message.CursorPosition') try { console.log('set (',key,'=',value,' ) from: ',(new Error("StackLog")).stack.split("\n")[2].split('/').pop() ) } catch(err) {}
        AppDirector.data[key] = value;
        if (persist) localStorage.setItem(key, value);
        //callback subs
        if (AppDirector.data[key] === undefined) return;
        for (let id in AppDirector.subs[key]) {
            AppDirector.subs[key][id](value);
        }
    }

    static bindInnerText(elId,dataName,formatter) {
        return this.on(dataName, val => {
            let el = document.getElementById(elId);
            if (el) {
                if (formatter) val = formatter(val);
                document.getElementById(elId).innerText = val;
            } else {
                console.log("Failed to bind value=",val,"to missing id=",elId);
            }

        })
    }

    static push(key,value,persist = true,blur = false) {
        if (blur) document.activeElement.blur();
        if (!AppDirector.data[key]) AppDirector.data[key] = [];
        if (!AppDirector.data[key].includes(value)) {
            AppDirector.data[key].push(value);
            if (persist) localStorage.setItem(key, JSON.stringify(AppDirector.data[key]));
        }
        if (AppDirector.data[key] === undefined) return;
        for (let id in AppDirector.subs[key]) {
            AppDirector.subs[key][id](value);
        }
    }

    static removeItem(key,value,persist = true) {
        AppDirector.data[key] = AppDirector.data[key].filter( v2 => (v2 !== value) )
        if (persist) localStorage.setItem(key, JSON.stringify(AppDirector.data[key]));
    }

    static on(key,cb) {
        let id = AppDirector.index++;
        if (AppDirector.subs === undefined) AppDirector.subs = {};
        if (AppDirector.subs[key] === undefined) AppDirector.subs[key] = {};
        AppDirector.subs[key][id] = cb;
        return { off : () => delete AppDirector.subs[key][id] }
    }

    static restoreData() {
        Object.keys(localStorage).map( key =>  {
            if (key.indexOf('Model.') > -1) {
                let value;
                try {
                    JSON.parse(localStorage.getItem(key)).map( val => {
                        AppDirector.push(key,val);
                    })
                } catch (e) {
                    value = localStorage.getItem(key);
                    if (value !== '') AppDirector.set(key,value);
                }
            }
        })
    }

    static resetData() {
        localStorage.clear();
    }

}

//attach director to the main window for simplified menu event bindings
window.CloudStudioDirector = AppDirector;