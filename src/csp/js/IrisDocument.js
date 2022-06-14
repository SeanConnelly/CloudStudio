import {AppDirector} from './AppDirector.js';

export class IrisDocument {

    constructor(ns,name,content) {
        this.ns = ns;
        this.name = name;
        this.content = content;
        this.language = this.getLanguage(name.split('.').pop().toLowerCase());
        //this.meta = { tabLayoutId : undefined }
        this.isDTL = this.checkIsDTL()
    }

    static open(ns,docName) {
        return new Promise( (resolve,reject) => {
            let url = `/api/atelier/v1/${encodeURI(ns)}/doc/${encodeURI(docName)}`;
            fetch(url).then( res => res.json()).then( data => {
                resolve(new IrisDocument(ns,docName,data.result.content.join(String.fromCharCode(10))));
            }).catch( err => {
                reject(err);
            })
        })
    }

    save() {
        return fetch(`/api/atelier/v1/${encodeURI(this.ns)}/doc/${encodeURI(this.name)}?ignoreConflict=1`,{
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "enc" : false,
                "content" : this.content.split(String.fromCharCode(10))
            })
        })
    }

    compile() {
        return fetch(`/api/atelier/v1/${encodeURI(this.ns)}/action/compile`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([this.name])
        })
    }

    keep() {

    }

    getLanguage(ext) {
        if (ext === 'cls') return "ObjectScript";
        if (ext === 'int') return "ObjectScript";
        if (ext === 'mac') return "ObjectScript";
        return extensions['.' + ext] || 'text';
    }

    checkIsDTL() {
        //simple text match for now, todo - replace with cleaner solution
        return (this.content.indexOf('Ens.DataTransformDTL') > -1)
    }

    //TODO: shift responsibility for listing (fetching from server) the Iris documents
    static listAll(ns) {}
    static listByType(ns,type) {}

}

const extensions = {".zpm":"xml",".csr":"html",".csp":"html",".dfi":"xml",".hl7":"xml",".ast":"xml",".x12":"xml",".abap":"abap",".clj":"clojure",".boot":"clojure",".cl2":"clojure",".cljc":"clojure",".cljs":"clojure",".cljs.hl":"clojure",".cljscm":"clojure",".cljx":"clojure",".hic":"clojure",".rg":"clojure",".edn":"clojure",".wisp":"clojure",".cson":"coffee",".coffee":"coffee","._coffee":"coffee",".cake":"csharp",".cjsx":"coffee",".iced":"coffee",".em":"coffee",".emberscript":"coffee",".bf":"csharp",".cs":"csharp",".csx":"csharp",".linq":"csharp",".eq":"csharp",".uno":"csharp",".css":"css",".dart":"dart",".dockerfile":"dockerfile",".ex":"elixir",".exs":"elixir",".handlebars":"handlebars",".hbs":"handlebars",".astro":"html",".html":"html",".hta":"html",".htm":"html",".html.hl":"html",".inc":"sql",".xht":"html",".xhtml":"html",".kit":"html",".mtml":"html",".riot":"html",".st":"html",".svelte":"html",".vue":"html",".OutJob":"ini",".PcbDoc":"ini",".PrjPCB":"ini",".SchDoc":"ini",".gitconfig":"ini",".ini":"ini",".cfg":"ini",".dof":"ini",".lektorproject":"ini",".prefs":"ini",".pro":"ini",".properties":"ini",".reg":"ini",".cls":"java",".ck":"java",".j":"java",".java":"java",".jav":"java",".uc":"java",".cy":"javascript",".jsonc":"javascript",".sublime-build":"javascript",".sublime-commands":"javascript",".sublime-completions":"javascript",".sublime-keymap":"javascript",".sublime-macro":"javascript",".sublime-menu":"javascript",".sublime-mousemap":"javascript",".sublime-project":"javascript",".sublime-settings":"javascript",".sublime-theme":"javascript",".sublime-workspace":"javascript",".sublime_metrics":"javascript",".sublime_session":"javascript",".json5":"javascript",".jsonld":"javascript",".js":"javascript","._js":"javascript",".bones":"javascript",".cjs":"javascript",".es":"javascript",".es6":"javascript",".frag":"javascript",".gs":"javascript",".jake":"javascript",".javascript":"javascript",".jsb":"javascript",".jscad":"javascript",".jsfl":"javascript",".jsm":"javascript",".jss":"javascript",".jsx":"javascript",".mjs":"javascript",".njs":"javascript",".pac":"javascript",".sjs":"javascript",".ssjs":"javascript",".xsjs":"javascript",".xsjslib":"javascript",".js.erb":"javascript",".snap":"javascript",".pegjs":"javascript",".qs":"javascript",".tsx":"xml",".jl":"julia",".less":"less",".liquid":"liquid",".lua":"lua",".fcgi":"ruby",".nse":"lua",".p8":"lua",".pd_lua":"lua",".rbxs":"lua",".rockspec":"lua",".wlua":"lua",".t":"perl",".apib":"markdown",".md":"markdown",".markdown":"markdown",".mdown":"markdown",".mdwn":"markdown",".mdx":"markdown",".mkd":"markdown",".mkdn":"markdown",".mkdown":"markdown",".ronn":"markdown",".scd":"markdown",".workbook":"markdown",".rmd":"markdown",".cp":"pascal",".cps":"pascal",".pas":"pascal",".dfm":"pascal",".dpr":"pascal",".lpr":"pascal",".pascal":"pascal",".pp":"pascal",".pl":"perl",".al":"perl",".cgi":"python",".perl":"perl",".ph":"perl",".plx":"perl",".pm":"perl",".psgi":"perl",".pod":"perl",".pod6":"perl",".6pl":"perl",".6pm":"perl",".nqp":"perl",".p6":"perl",".p6l":"perl",".p6m":"perl",".pl6":"perl",".pm6":"perl",".raku":"perl",".rakumod":"perl",".pgsql":"pgsql",".sql":"sql",".phtml":"php",".hack":"php",".hh":"php",".hhi":"php",".php":"php",".aw":"php",".ctp":"php",".php3":"php",".php4":"php",".php5":"php",".phps":"php",".phpt":"php",".zep":"php",".ps1":"powershell",".psd1":"powershell",".psm1":"powershell",".proto":"protobuf",".eb":"python",".gn":"python",".gni":"python",".py":"python",".gyp":"python",".gypi":"python",".lmi":"python",".py3":"python",".pyde":"python",".pyi":"python",".pyp":"python",".pyt":"python",".pyw":"python",".rpy":"python",".smk":"python",".spec":"ruby",".tac":"python",".wsgi":"python",".xpy":"python",".sage":"python",".sagews":"python",".bzl":"python",".r":"r",".rd":"r",".rsx":"r",".cshtml":"razor",".razor":"razor",".cr":"ruby",".hcl":"ruby",".nomad":"ruby",".tf":"ruby",".tfvars":"ruby",".workflow":"xml",".druby":"ruby",".duby":"ruby",".mirah":"ruby",".rb":"ruby",".builder":"ruby",".eye":"ruby",".gemspec":"ruby",".god":"ruby",".jbuilder":"ruby",".mspec":"ruby",".pluginspec":"xml",".podspec":"ruby",".prawn":"ruby",".rabl":"ruby",".rake":"ruby",".rbi":"ruby",".rbuild":"ruby",".rbw":"ruby",".rbx":"ruby",".ru":"ruby",".ruby":"ruby",".thor":"ruby",".watchr":"ruby",".res":"xml",".re":"rust",".rei":"rust",".rs":"xml",".rs.in":"rust",".scala":"scala",".kojo":"scala",".sbt":"scala",".sc":"scala",".nu":"scheme",".scm":"scheme",".sch":"xml",".sld":"scheme",".sls":"yaml",".sps":"scheme",".ss":"scheme",".scss":"scss",".q":"sql",".hql":"sql",".pls":"sql",".bdy":"sql",".ddl":"sql",".fnc":"sql",".pck":"sql",".pkb":"sql",".pks":"sql",".plb":"sql",".plsql":"sql",".prc":"sql",".spc":"sql",".tpb":"sql",".tps":"sql",".trg":"sql",".vw":"sql",".cql":"sql",".mysql":"sql",".tab":"sql",".udf":"sql",".viw":"sql",".db2":"sql",".glf":"tcl",".tcl":"tcl",".adp":"tcl",".tcl.in":"tcl",".tm":"tcl",".twig":"twig",".ts":"xml",".dae":"xml",".brd":"xml",".kid":"xml",".lvproj":"xml",".lvlib":"xml",".svg":"xml",".owl":"xml",".xml":"xml",".adml":"xml",".admx":"xml",".ant":"xml",".axml":"xml",".builds":"xml",".ccproj":"xml",".ccxml":"xml",".clixml":"xml",".cproject":"xml",".cscfg":"xml",".csdef":"xml",".csl":"xml",".csproj":"xml",".ct":"xml",".depproj":"xml",".dita":"xml",".ditamap":"xml",".ditaval":"xml",".dll.config":"xml",".dotsettings":"xml",".filters":"xml",".fsproj":"xml",".fxml":"xml",".glade":"xml",".gml":"xml",".gmx":"xml",".grxml":"xml",".gst":"xml",".iml":"xml",".ivy":"xml",".jelly":"xml",".jsproj":"xml",".kml":"xml",".launch":"xml",".mdpolicy":"xml",".mjml":"xml",".mm":"xml",".mod":"xml",".mxml":"xml",".natvis":"xml",".ncl":"xml",".ndproj":"xml",".nproj":"xml",".nuspec":"xml",".odd":"xml",".osm":"xml",".pkgproj":"xml",".proj":"xml",".props":"xml",".ps1xml":"xml",".psc1":"xml",".pt":"xml",".rdf":"xml",".resx":"xml",".rss":"xml",".scxml":"xml",".sfproj":"xml",".shproj":"xml",".srdf":"xml",".storyboard":"xml",".sublime-snippet":"xml",".targets":"xml",".tml":"xml",".ui":"xml",".urdf":"xml",".ux":"xml",".vbproj":"xml",".vcxproj":"xml",".vsixmanifest":"xml",".vssettings":"xml",".vstemplate":"xml",".vxml":"xml",".wixproj":"xml",".wsdl":"xml",".wsf":"xml",".wxi":"xml",".wxl":"xml",".wxs":"xml",".x3d":"xml",".xacro":"xml",".xaml":"xml",".xib":"xml",".xlf":"xml",".xliff":"xml",".xmi":"xml",".xml.dist":"xml",".xmp":"xml",".xproj":"xml",".xsd":"xml",".xspec":"xml",".xul":"xml",".zcml":"xml",".plist":"xml",".stTheme":"xml",".tmCommand":"xml",".tmLanguage":"xml",".tmPreferences":"xml",".tmSnippet":"xml",".tmTheme":"xml",".xsp-config":"xml",".xsp.metadata":"xml",".xpl":"xml",".xproc":"xml",".xslt":"xml",".xsl":"xml",".cwl":"yaml",".ksy":"yaml",".lookml":"yaml",".model.lkml":"yaml",".view.lkml":"yaml",".raml":"yaml",".sfd":"yaml",".anim":"yaml",".asset":"yaml",".mask":"yaml",".mat":"yaml",".meta":"yaml",".prefab":"yaml",".unity":"yaml",".yml":"yaml",".mir":"yaml",".reek":"yaml",".rviz":"yaml",".sublime-syntax":"yaml",".syntax":"yaml",".yaml":"yaml",".yaml-tmlanguage":"yaml",".yaml.sed":"yaml",".yml.mysql":"yaml"}
