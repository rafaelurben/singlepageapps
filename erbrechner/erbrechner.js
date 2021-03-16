// Erbrechner by rafaelurben

///// Calculation

class Person {
    // Static fields

    static everyone = [];
    static root = null;

    // Static methods

    static resetDistribution() {
        for (let person of this.everyone) {
            person.share_percent = 0;
            person.share_absolute = 0;
            person.min_share_percent = 0;
            person.min_share_absolute = 0;
        }
    }

    static calculateAbsoluteValues(amount) {
        for (let person of this.everyone) {
            person.share_absolute = person.share_percent * amount;
            person.min_share_absolute = person.min_share_percent * amount;
        }
    }

    static distribute() {
        this.resetDistribution();
        if (this.root.partner && this.root.partner.alive) {
            if (this.root.isParental1Alive) {
                this.root.partner.share_percent = 1 / 2;
                this.root.partner.min_share_percent = (1 / 2) * (1 / 2);

                this.root.distributeToParental1(1 / 2, 3 / 4, true);
            } else if (this.root.isParental2Alive) {
                this.root.partner.share_percent = 3 / 4;
                this.root.partner.min_share_percent = (3 / 4) * (1 / 2);

                this.root.distributeToParental2(1 / 4, 1 / 2)
            } else {
                this.root.partner.share_percent = 1 / 1;
                this.root.partner.min_share_percent = (1 / 1) * (1 / 2);
            }
        } else {
            if (this.root.isParental1Alive) {
                this.root.distributeToParental1(1 / 1, 1 / 2, true);
            } else if (this.root.isParental2Alive) {
                this.root.distributeToParental2(1 / 1, 1 / 2);
            } else if (this.root.isParental3Alive) {
                this.root.distributeToParental3(1 / 1);
            }
        }
    }

    // Constructor

    constructor(name, alive, isroot = false) {
        this.name = String(name);
        this.alive = Boolean(alive);
        this.generation = null;

        this.parent1 = null;
        this.parent2 = null;

        this.children = [];

        this.share_percent = 0;
        this.share_absolute = 0;
        this.min_share_percent = 0;
        this.min_share_absolute = 0;

        Person.everyone.push(this);

        if (isroot) {
            Person.root = this;
            this.partner = null;
            this.generation = 0;
        };
    }

    // Properties

    /// Parentals

    get isParental1Alive() {
        for (let child of this.children) {
            if (child.isTreeAlive) return true;
        }
        return false;
    }

    get isParental2Alive() {
        return (this.parent1 && this.parent1.isTreeAlive) || (this.parent2 && this.parent2.isTreeAlive);
    }

    get isParental3Alive() {
        return (this.parent1 && this.parent1.isParental2Alive) || (this.parent2 && this.parent2.isParental2Alive)
    }

    /// Helpers

    get isTreeAlive() {
        return this.alive || this.isParental1Alive;
    }

    get childrenWithTreeAlive() {
        let list = [];
        for (let child of this.children) {
            if (child.isTreeAlive) {
                list.push(child);
            }
        }
        return list;
    }

    get canDelete() {
        return (Person.root !== this && Person.root.partner !== this && this.generation !== -2 && !(this.generation === -1 && ((Person.root.parent1 && Person.root.parent1 === this) || (Person.root.parent2 && Person.root.parent2 === this))));
    }

    get canHaveChildren() {
        return Person.root.partner !== this;
    }

    get canBeAlive() {
        return Person.root !== this;
    }

    get id() {
        return Person.everyone.indexOf(this);
    }

    get displayName() {
        let id = this.id.toString().padStart(2, "0");
        return (this.alive ? `(${id}) ` : `[${id}] `) + this.name;
    }

    // Methods

    addChild(child, parent2 = null) {
        child.generation = this.generation + 1;

        this.children.push(child);
        child.setParent1(this);

        if (parent2) {
            parent2.children.push(child);
            child.setParent2(parent2);
        };
    }

    setParent1(parent) {
        this.parent1 = parent;
        this.parent1.generation = this.generation - 1;
    }

    setParent2(parent) {
        this.parent2 = parent;
        this.parent2.generation = this.generation - 1;
    }

    delete() {
        if (this.canDelete) {
            if (this.parent1) {
                let index = this.parent1.children.indexOf(this);
                this.parent1.children.splice(index, 1);
            } 
            if (this.parent2) {
                let index = this.parent2.children.indexOf(this);
                this.parent2.children.splice(index, 1);
            }
            this.deleteRecursive();
            Person.resetDistribution();
        }
    }

    deleteRecursive() {
        for (let child of this.children) {
            child.deleteRecursive();
        }
        Person.everyone.splice(this.id, 1);
    }

    /// Distribution

    distributeToParental1(percent, mandatorypart = 0, ignorealive = false) {
        if (this.alive && !ignorealive) {
            this.share_percent += percent;
            this.min_share_percent += percent * mandatorypart;
        } else {
            let people_to_share_with = this.childrenWithTreeAlive;
            let percent_per_person = percent / people_to_share_with.length;
            for (let person of people_to_share_with) {
                person.distributeToParental1(percent_per_person, mandatorypart);
            }
        }
    }

    distributeToParental2(percent, mandatorypart = 0) {
        let p1 = this.parent1 && this.parent1.isTreeAlive;
        let p2 = this.parent2 && this.parent2.isTreeAlive;

        if (p1 && p2) {
            this.parent1.distributeToParental1(percent / 2);
            this.parent2.distributeToParental1(percent / 2);

            if (this.parent1.alive) this.parent1.min_share_percent = (percent / 2) * mandatorypart;
            if (this.parent2.alive) this.parent2.min_share_percent = (percent / 2) * mandatorypart;
        } else if (p1) {
            this.parent1.distributeToParental1(percent);

            if (this.parent1.alive) this.parent1.min_share_percent = percent * mandatorypart;
        } else if (p2) {
            this.parent2.distributeToParental1(percent);

            if (this.parent2.alive) this.parent2.min_share_percent = percent * mandatorypart;
        }
    }

    distributeToParental3(percent) {
        let p1 = (this.parent1 && (this.parent1.parent1 || this.parent1.parent2));
        let p2 = (this.parent2 && (this.parent2.parent1 || this.parent2.parent2));

        if (p1 && p2) {
            this.parent1.distributeToParental2(percent / 2, 0);
            this.parent2.distributeToParental2(percent / 2, 0);
        } else if (p1) {
            this.parent1.distributeToParental2(percent, 0);
        } else if (p2) {
            this.parent2.distributeToParental2(percent, 0);
        }
    }
}

///// Interface

let app = document.getElementById("app");

let menu_action = document.getElementById("menu_action");
let menu_select = document.getElementById("menu_select");
let menu_infos = document.getElementById("menu_infos");

class Interface {
    static selectedItem = null

    static fullscreen() {
        app.requestFullscreen();
    }

    static calculate(event = null) {
        Person.distribute();
        let value = parseInt(document.getElementById("valueinput").value);
        Person.calculateAbsoluteValues(value);
    }

    // Menus

    static _menu_setItems(menu, items) {
        menu.innerHTML = "";
        for (let item of items) {
            let elem = document.createElement(item.element || "a");
            elem.innerText = item.text || "";
            if (item.innerHTML) elem.innerHTML = item.innerHTML;
            elem.setAttribute("class", "dropdown-item");
            elem.setAttribute("href", "#");

            for (let attr in item) {
                if (!["innerHTML", "text"].includes(attr)) elem.setAttribute(attr, item[attr]);
            }

            menu.appendChild(elem);
        }
    }

    static _menu_updateSelectMenu() {
        let items = [
            { element: "strong", class: "dropdown-header", text: "Person auswählen" },
        ];
        for (let personid in Person.everyone) {
            let person = Person.everyone[personid];
            items.push({
                text: person.displayName,
                onclick: `Interface.select(${person.id});`,
                class: (person === this.selectedItem) ? "dropdown-item active" : "dropdown-item"
            })
        }
        this._menu_setItems(menu_select, items);
    }

    static _menu_updateActionMenu() {
        let items = [];
        if (this.selectedItem === null) {
            items.push({ element: "strong", class: "dropdown-header", text: "Bitte wählen Sie zuerst eine Person aus!" });
        } else {
            items.push({ element: "strong", class: "dropdown-header", text: "Umbenennen" });
            items.push({ element: "div", innerHTML: `<input id="renameinput" class="form-control" placeholder="Umbenennen" oninput="Interface.rename();" value="${this.selectedItem.name}">`});
            
            if (this.selectedItem.canBeAlive || this.selectedItem.canDelete) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Ändern" });
                if (this.selectedItem.canBeAlive) items.push({ text: "Lebend / Tot", onclick: "Interface.toggleAlive();", class: this.selectedItem.alive ? "dropdown-item active" : "dropdown-item" });
                if (this.selectedItem.canDelete) items.push({ text: "Löschen (inkl. Nachkommen)", onclick: "Interface.delete();" });
            }
            if (this.selectedItem.canHaveChildren) {
                items.push({ element: "div", class: "dropdown-divider" });

                items.push({ element: "strong", class: "dropdown-header", text: "Kind hinzufügen" });

                let other = null;
                if (Person.root.parent2 && this.selectedItem == Person.root.parent1) {
                    other = Person.root.parent2;
                } else if (Person.root.parent1 && this.selectedItem == Person.root.parent2) {
                    other = Person.root.parent1;
                } else if (Person.root.parent1 && Person.root.parent1.parent2 && this.selectedItem == Person.root.parent1.parent1) {
                    other = Person.root.parent1.parent2;
                } else if (Person.root.parent1 && Person.root.parent1.parent1 && this.selectedItem == Person.root.parent1.parent2) {
                    other = Person.root.parent1.parent1;
                } else if (Person.root.parent2 && Person.root.parent2.parent2 && this.selectedItem == Person.root.parent2.parent1) {
                    other = Person.root.parent2.parent2;
                } else if (Person.root.parent2 && Person.root.parent2.parent1 && this.selectedItem == Person.root.parent2.parent2) {
                    other = Person.root.parent2.parent1;
                }

                if (other) {
                    items.push({ text: `Kind mit (${other.id}) ${other.name}`, onclick: `Interface.addChild(${this.selectedItem.id},${other.id});` });
                    items.push({ text: "Kind mit anderer Person", onclick: `Interface.addChild(${this.selectedItem.id});` });
                } else {
                    items.push({ text: "Neues Kind", onclick: `Interface.addChild(${this.selectedItem.id});` });
                }
            }
        }
        this._menu_setItems(menu_action, items);
    }

    static _menu_updateInfosMenu() {
        let items = [];
        if (this.selectedItem === null) {
            items.push({ element: "strong", class: "dropdown-header", text: "Bitte wählen Sie zuerst eine Person aus!" });
        } else {
            items.push({ element: "strong", class: "dropdown-header", text: "Generell" });
            items.push({ class: "dropdown-item disabled", text: `ID: ${this.selectedItem.id}` });
            items.push({ class: "dropdown-item disabled", text: `Name: ${this.selectedItem.name}` });
            items.push({ class: "dropdown-item disabled", text: "Status: " + (this.selectedItem.alive ? "Lebend" : "Tot") });
            
            if (this.selectedItem.alive) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Erbanteil" });
            }

            if (this.selectedItem.parent1 || this.selectedItem.parent2) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Eltern" });
                if (this.selectedItem.parent1) items.push({ text: this.selectedItem.parent1.displayName, onclick: `Interface.select(${this.selectedItem.parent1.id});` });
                if (this.selectedItem.parent2) items.push({ text: this.selectedItem.parent2.displayName, onclick: `Interface.select(${this.selectedItem.parent2.id});` });
            }

            if (this.selectedItem.children.length > 0) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Kinder" });
                for (let child of this.selectedItem.children) {
                    items.push({ text: child.displayName, onclick: `Interface.select(${child.id});` });
                }
            }
        }
        this._menu_setItems(menu_infos, items);
    }

    // Actions

    static select(itemid) {
        this.selectedItem = Person.everyone[itemid];
        this.update();
    }

    static delete() {
        this.selectedItem.delete();
        this.selectedItem = null;
        this.update();
    }

    static rename() {
        this.selectedItem.name = document.getElementById("renameinput").value;
        this._menu_updateSelectMenu();
        this._menu_updateInfosMenu();
    }

    static toggleAlive() {
        this.selectedItem.alive = !this.selectedItem.alive;
        this.update();
    }

    static addChild(p1id, p2id=null) {
        let child = new Person("Neues Kind", true);
        let parent1 = Person.everyone[p1id];
        let parent2 = p2id === null ? null : Person.everyone[p2id];
        parent1.addChild(child, parent2);
        this.select(child.id);
    }

    // Draw


    // General

    static update() {
        this._menu_updateSelectMenu();
        this._menu_updateActionMenu();
        this._menu_updateInfosMenu();
        this.calculate();
    }

    // Events

    static onfullscreenchange(event) {
        if (document.fullscreenElement != null) {
            document.getElementById("fullscreen-open").style.display = "none";
            document.getElementById("fullscreen-close").style.display = "block";
        } else {
            document.getElementById("fullscreen-open").style.display = "block";
            document.getElementById("fullscreen-close").style.display = "none";
        }
    }
}

document.getElementById("valueinput").oninput = Interface.calculate;
document.onfullscreenchange = Interface.onfullscreenchange;

///// FamilyTree

class FamilyTree {
    static STAGEWIDTH = 4000;
    static STAGEHEIGHT = 2000;
    static stage = new Konva.Stage({
        container: 'canvascontainer',
        width: this.STAGEWIDTH,
        height: this.STAGEHEIGHT,
        draggable: true,
    })

    static fitStageIntoParentContainer() {
        var container = document.querySelector('#canvascontainer');
        var containerWidth = container.offsetWidth;
        var scale = containerWidth / FamilyTree.STAGEWIDTH;

        FamilyTree.stage.width(FamilyTree.STAGEWIDTH * scale);
        FamilyTree.stage.height(FamilyTree.STAGEHEIGHT * scale);
        FamilyTree.stage.scale({ x: scale, y: scale });
        FamilyTree.stage.draw();
      }

    static setup() {
        var layer = new Konva.Layer();
        FamilyTree.stage.add(layer);

        var WIDTH = FamilyTree.STAGEWIDTH;
        var HEIGHT = FamilyTree.STAGEHEIGHT;
        var NUMBER = 200;

        function generateNode() {
            return new Konva.Circle({
                x: WIDTH * Math.random(),
                y: HEIGHT * Math.random(),
                radius: 50,
                fill: 'red',
                stroke: 'black',
            });
        }

        for (var i = 0; i < NUMBER; i++) {
            layer.add(generateNode());
        }
        layer.draw();
    }
}

window.addEventListener('load', FamilyTree.fitStageIntoParentContainer);
window.addEventListener('resize', FamilyTree.fitStageIntoParentContainer);

///// Basic

p = new Person("Ich", false, true)
p.partner = new Person("Ehepartner", false)

p.setParent1(new Person("Vater", true))
p.parent1.setParent1(new Person("Grossvater (paternal)", false))
p.parent1.setParent2(new Person("Grossmutter (paternal)", false))

p.setParent2(new Person("Mutter", false))
p.parent2.setParent1(new Person("Grossvater (maternal)", false))
p.parent2.setParent2(new Person("Grossmutter (maternal)", false))

Interface.select(0);