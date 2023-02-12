export class TopMenu {

    constructor() {
        this.topMenu = document.getElementById("top-menu");
        this.initialiseListeners();
    }

    initialiseListeners() {
        this.topMenu.addEventListener("mouseover", ev => {
            let menuItems = this.topMenu.querySelectorAll(".menu-top-button");
            let el = ev.target;
            for (let i=0;i<menuItems.length;i++) {
                let btn = menuItems[i];
                if (btn.id === document.activeElement.id) {
                    el.focus();
                }
            }
        })
    }

}

