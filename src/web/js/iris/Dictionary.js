import {System} from './System.js';
import {AppDirector} from "../AppDirector.js";

export class Dictionary {

    static getClassStaticMembers(ns,className) {
        let query = `SELECT Name,FormalSpec FROM %Dictionary.CompiledMethod WHERE parent=? AND ClassMethod=1`
        return System.Query(ns,query,[className])
    }

}

/*
Dictionary.getClassStaticMembers('IWS','User.SampleClass').then( response => {
    console.log('response ------');
    console.log(response.result.content);
    console.log('-------');
})
*/
