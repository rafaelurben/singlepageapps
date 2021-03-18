// Erbrechner by rafaelurben

///// Calculation

class Person {
    // Static fields

    static everyoneById = {}
    static root = null;

    static highestid = 0;

    static free_quota_percent = 0;
    static free_quota_absolute = 0;

    // Static properties

    static get everyone() {
        return Object.values(Person.everyoneById)
    }

    // Static methods

    static resetDistribution() {
        Person.free_quota_percent = 0;
        Person.free_quota_absolute = 0;
        for (let person of Person.everyone) {
            person.share_percent = 0;
            person.share_absolute = 0;
            person.min_share_percent = 0;
            person.min_share_absolute = 0;
        }
    }

    static distribute(amount = 0) {
        Person.resetDistribution();

        // Distribution
        if (Person.root.partner && Person.root.partner.alive) {
            if (Person.root.isParental1Alive) {
                Person.root.partner.share_percent = 1 / 2;
                Person.root.partner.min_share_percent = (1 / 2) * (1 / 2);

                Person.root.distributeToParental1(1 / 2, 3 / 4, true);
            } else if (Person.root.isParental2Alive) {
                Person.root.partner.share_percent = 3 / 4;
                Person.root.partner.min_share_percent = (3 / 4) * (1 / 2);

                Person.root.distributeToParental2(1 / 4, 1 / 2)
            } else {
                Person.root.partner.share_percent = 1 / 1;
                Person.root.partner.min_share_percent = (1 / 1) * (1 / 2);
            }
        } else {
            if (Person.root.isParental1Alive) {
                Person.root.distributeToParental1(1 / 1, 1 / 2, true);
            } else if (Person.root.isParental2Alive) {
                Person.root.distributeToParental2(1 / 1, 1 / 2);
            } else if (Person.root.isParental3Alive) {
                Person.root.distributeToParental3(1 / 1);
            }
        }

        // Free quota + absolute share
        Person.free_quota_percent = 1;
        for (let person of Person.everyone) {
            person.share_absolute = person.share_percent * amount;
            person.min_share_absolute = person.min_share_percent * amount;
            Person.free_quota_percent -= person.min_share_percent;
        }
        Person.free_quota_absolute = Person.free_quota_percent * amount;
    }

    static json() {
        return {
            everyone: Person.everyone.map(p => p.json()),
            root_id: Person.root.id,
            free_quota_percent: Person.free_quota_percent,
            free_quota_absolute: Person.free_quota_absolute,
        }
    }

    // Constructor

    constructor(name, alive, isroot = false) {
        this.id = Person.highestid++;
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

        Person.everyoneById[this.id] = this;

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

    get isPartner() {
        return Person.root.partner === this;
    }

    get isRoot() {
        return Person.root === this;
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
        delete Person.everyoneById[this.id];
    }

    json() {
        return {
            id: this.id,
            name: this.name,
            alive: this.alive,
            generation: this.generation,
            share_percent: this.share_percent,
            share_absolute: this.share_absolute,
            min_share_percent: this.min_share_percent,
            min_share_absolute: this.min_share_absolute,

            parent1_id: this.parent1 ? this.parent1.id : null,
            parent2_id: this.parent2 ? this.parent2.id : null,
            children_ids: this.children.map(c => c.id),
        }
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
        for (let person of Person.everyone) {
            items.push({
                text: person.displayName,
                onclick: `Interface.select(${person.id});`,
                class: (person === Interface.selectedItem) ? "dropdown-item active" : "dropdown-item"
            })
        }
        Interface._menu_setItems(menu_select, items);
    }

    static _menu_updateActionMenu() {
        let items = [];
        if (Interface.selectedItem === null) {
            items.push({ element: "strong", class: "dropdown-header", text: "Bitte wählen Sie zuerst eine Person aus!" });
        } else {
            items.push({ element: "strong", class: "dropdown-header", text: "Umbenennen" });
            items.push({ element: "div", innerHTML: `<input id="renameinput" class="form-control" placeholder="Umbenennen" oninput="Interface.rename();" value="${Interface.selectedItem.name}">` });

            if (!Interface.selectedItem.isRoot || Interface.selectedItem.canDelete) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Ändern" });
                if (!Interface.selectedItem.isRoot) items.push({ text: "Lebend / Tot", onclick: "Interface.toggleAlive();", class: Interface.selectedItem.alive ? "dropdown-item active" : "dropdown-item" });
                if (Interface.selectedItem.canDelete) items.push({ text: "Löschen (inkl. Nachkommen)", onclick: "Interface.delete();" });
            }
            if (!Interface.selectedItem.isPartner) { // Allow children for everyone except partner
                items.push({ element: "div", class: "dropdown-divider" });

                items.push({ element: "strong", class: "dropdown-header", text: "Kind hinzufügen" });

                let other = null;
                if (Person.root.parent2 && Interface.selectedItem == Person.root.parent1) {
                    other = Person.root.parent2;
                } else if (Person.root.parent1 && Interface.selectedItem == Person.root.parent2) {
                    other = Person.root.parent1;
                } else if (Person.root.parent1 && Person.root.parent1.parent2 && Interface.selectedItem == Person.root.parent1.parent1) {
                    other = Person.root.parent1.parent2;
                } else if (Person.root.parent1 && Person.root.parent1.parent1 && Interface.selectedItem == Person.root.parent1.parent2) {
                    other = Person.root.parent1.parent1;
                } else if (Person.root.parent2 && Person.root.parent2.parent2 && Interface.selectedItem == Person.root.parent2.parent1) {
                    other = Person.root.parent2.parent2;
                } else if (Person.root.parent2 && Person.root.parent2.parent1 && Interface.selectedItem == Person.root.parent2.parent2) {
                    other = Person.root.parent2.parent1;
                }

                if (other) {
                    items.push({ text: `Kind mit (${other.id}) ${other.name}`, onclick: `Interface.addChild(${Interface.selectedItem.id},${other.id});` });
                    items.push({ text: "Kind mit anderer Person", onclick: `Interface.addChild(${Interface.selectedItem.id});` });
                } else {
                    items.push({ text: "Neues Kind", onclick: `Interface.addChild(${Interface.selectedItem.id});` });
                }
            }
        }
        Interface._menu_setItems(menu_action, items);
    }

    static _menu_updateInfosMenu() {
        let items = [];
        if (Interface.selectedItem === null) {
            items.push({ element: "strong", class: "dropdown-header", text: "Bitte wählen Sie zuerst eine Person aus!" });
        } else {
            items.push({ element: "strong", class: "dropdown-header", text: "Generell" });
            items.push({ class: "dropdown-item disabled", text: `ID: ${Interface.selectedItem.id}` });
            items.push({ class: "dropdown-item disabled", text: `Name: ${Interface.selectedItem.name}` });
            items.push({ class: "dropdown-item disabled", text: "Status: " + (Interface.selectedItem.alive ? "Lebend" : "Tot") });

            if (Interface.selectedItem.alive) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Erbanteil" });
                items.push({ class: "dropdown-item disabled", text: `Relativ: ${Interface.selectedItem.share_percent * 100}%` });
                items.push({ class: "dropdown-item disabled", text: `Absolut: ${Interface.selectedItem.share_absolute} CHF` });
                items.push({ class: "dropdown-item disabled", text: `Min. Relativ: ${Interface.selectedItem.min_share_percent * 100}%` });
                items.push({ class: "dropdown-item disabled", text: `Min. Absolut: ${Interface.selectedItem.min_share_absolute} CHF` });
            } else if (Interface.selectedItem === Person.root) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Freie Quote" });
                items.push({ class: "dropdown-item disabled", text: `Relativ: ${Person.free_quota_percent * 100}%` });
                items.push({ class: "dropdown-item disabled", text: `Absolut: ${Person.free_quota_absolute} CHF` });
            }

            if (Interface.selectedItem.parent1 || Interface.selectedItem.parent2) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Eltern" });
                if (Interface.selectedItem.parent1) items.push({ text: Interface.selectedItem.parent1.displayName, onclick: `Interface.select(${Interface.selectedItem.parent1.id});` });
                if (Interface.selectedItem.parent2) items.push({ text: Interface.selectedItem.parent2.displayName, onclick: `Interface.select(${Interface.selectedItem.parent2.id});` });
            }

            if (Interface.selectedItem.children.length > 0) {
                items.push({ element: "div", class: "dropdown-divider" });
                items.push({ element: "strong", class: "dropdown-header", text: "Kinder" });
                for (let child of Interface.selectedItem.children) {
                    items.push({ text: child.displayName, onclick: `Interface.select(${child.id});` });
                }
            }
        }
        Interface._menu_setItems(menu_infos, items);
    }

    // Actions

    static select(itemid) {
        Interface.selectedItem = Person.everyoneById[itemid];
        Interface.update();
    }

    static delete() {
        FamilyTreePerson.deleteById(Interface.selectedItem.id);
        Interface.selectedItem.delete();
        Interface.selectedItem = null;
        Interface.update();
    }

    static rename() {
        Interface.selectedItem.name = document.getElementById("renameinput").value;
        Interface._menu_updateSelectMenu();
        Interface._menu_updateInfosMenu();
        FamilyTreePerson.updateById(Interface.selectedItem.id);
    }

    static toggleAlive() {
        Interface.selectedItem.alive = !Interface.selectedItem.alive;
        Interface.update();
    }

    static addChild(p1id, p2id = null) {
        let child = new Person("Neues Kind", true);
        let parent1 = Person.everyoneById[p1id];
        let parent2 = p2id === null ? null : Person.everyoneById[p2id];
        parent1.addChild(child, parent2);
        Interface.select(child.id);
    }

    // General

    static update() {
        Person.distribute(parseInt(document.getElementById("valueinput").value || 0));
        Interface._menu_updateSelectMenu();
        Interface._menu_updateActionMenu();
        Interface._menu_updateInfosMenu();
        FamilyTreePerson.updateAll();
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

document.getElementById("valueinput").oninput = Interface.update;
document.onfullscreenchange = Interface.onfullscreenchange;

///// FamilyTree

class FamilyTreePerson {
    static layer = new Konva.Layer();
    static everyoneById = {};

    static updateAll() {
        for (let id in Person.everyoneById) {
            if (FamilyTreePerson.everyoneById.hasOwnProperty(id)) {
                FamilyTreePerson.everyoneById[id].update();
            } else {
                new FamilyTreePerson(Person.everyoneById[id]);
            }
        }
        FamilyTreePerson.layer.draw();
    }

    static deleteById(id) {
        FamilyTreePerson.everyoneById[id].delete();
    }

    static updateById(id) {
        FamilyTreePerson.everyoneById[id].update();
    }

    // static createArrow(object1, object2) {

    // }

    constructor (person) {
        this.person = person;
        this.group = new Konva.Group({
            x: 0,
            y: (person.generation + 2) * 220,
            draggable: true,
            dragBoundFunc: pos => {
                return { x: pos.x, y: this.group.absolutePosition().y }
            }
        })
        this.group.on('click', () => { Interface.select(this.person.id); });

        this.rect = new Konva.Rect({
            x: 0, y: 0, width: 400, height: 180, 
            fill: "orange", stroke: "white", strokeWidth: 2,
            cornerRadius: 10,
        })
        this.group.add(this.rect);

        this.text_title = new Konva.Text({
            x: 10, y: 10, text: `Loading...`, fontSize: 25, fill: "white",
        })
        this.group.add(this.text_title);

        this.text_info = new Konva.Text({
            x: 15, y: 40, text: `Loading...`, fontSize: 25, fill: "black",
        })
        this.group.add(this.text_info);

        FamilyTreePerson.everyoneById[this.person.id] = this;
        this.update();
        FamilyTreePerson.layer.add(this.group);
    }


    get information() {
        if (this.person.isRoot) {
            return `Freie Quote:\n  Relativ: ${Person.free_quota_percent*100}%\n  Absolut: ${Person.free_quota_absolute} CHF`;
        } else {
            return `Erbanteil:\n  Relativ: ${this.person.share_percent*100}%\n  Absolut: ${this.person.share_absolute} CHF\n  Min. Relativ: ${this.person.min_share_percent*100}%\n  Min. Absolut: ${this.person.min_share_absolute} CHF`;
        }
    }   

    update() {
        this.text_title.text(`${this.person.id} ${this.person.name}`);
        this.text_info.text(this.information);
        this.rect.fill(this.person.isRoot ? "#2E86AB" : (this.person.alive ? (this.person.isPartner ? "#AF3B6E" : "#6B7FD7") : "#4C2A85"));
        this.rect.stroke(this.person === Interface.selectedItem ? "red" : "white");
        this.rect.strokeWidth(this.person === Interface.selectedItem ? 5 : 2);
    }

    delete() {
        this.text_title.destroy();
        this.text_info.destroy();
        this.rect.destroy();
        this.group.destroy();
        delete FamilyTreePerson.everyoneById[this.person.id];
        for (let child of this.person.children) {
            FamilyTreePerson.deleteById(child.id);
        }
    }
}

class FamilyTree {
    static STAGEWIDTH = 2000;
    static STAGEHEIGHT = 2000;
    static stage = new Konva.Stage({
        container: 'canvascontainer',
        width: this.STAGEWIDTH,
        height: this.STAGEHEIGHT,
        draggable: true,
    })

    /// Events

    static fitStageIntoParentContainer() {
        console.log("FamilyTree.fitStageIntoParentContainer");
        
        var container = document.querySelector('#canvascontainer');
        var containerWidth = container.offsetWidth;
        var scale = containerWidth / FamilyTree.STAGEWIDTH;

        FamilyTree.stage.width(FamilyTree.STAGEWIDTH * scale);
        FamilyTree.stage.height(FamilyTree.STAGEHEIGHT * scale);
        FamilyTree.stage.scale({ x: scale, y: scale });
        FamilyTree.stage.draw();
    }
}

FamilyTree.stage.add(FamilyTreePerson.layer);

window.addEventListener('load', FamilyTree.fitStageIntoParentContainer);
window.addEventListener('resize', FamilyTree.fitStageIntoParentContainer);
window.addEventListener('load', FamilyTreePerson.updateAll);

///// Basic Family

p = new Person("Ich", false, true)
p.partner = new Person("Ehepartner", false)

p.setParent1(new Person("Vater", true))
p.parent1.setParent1(new Person("Grossvater (paternal)", false))
p.parent1.setParent2(new Person("Grossmutter (paternal)", false))

p.setParent2(new Person("Mutter", true))
p.parent2.setParent1(new Person("Grossvater (maternal)", false))
p.parent2.setParent2(new Person("Grossmutter (maternal)", false))

Interface.select(0);
