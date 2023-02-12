export class CodeTemplates {

    static GetTemplate(type,name) {
        let tpl = templates[type] || [];
        let src = tpl.join(String.fromCharCode(10));
        return src.replace('%1',name);
    }

}

let templates = {
    "Registered":["Class %1 Extends %RegisteredObject","{","","}"],
    "Persistent":["Class %1 Extends %Persistent","{","","}"],
    "Registered XML":["Class %1 Extends (%RegisteredObject, %XML.Adaptor)","{","","}"],
    "Persistent XML":["Class %1 Extends (%Persistent, %XML.Adaptor)","{","","}"],
    "Serial":["Class %1 Extends %SerialObject","{","","}"],
    "Abstract":["Class %1 Extends [ Abstract ]","{","","}"],
    "CSP":["Class %1 Extends %CSP.Page","{","","ClassMethod OnPage() As %Status","{","}","","}"],
}