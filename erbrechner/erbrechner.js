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

    constructor(name, alive, isroot=false) {
        this.id = Person.everyone.length;
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

    // Methods

    addChild(child, parent2=null) {
        child.generation = this.generation + 1;

        this.children.push(child);
        child.setParent1(this);
        
        if (parent2) {
            parent2.children.push(child);
            child.setParent2(this);
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
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

class Interface {
    static fullscreen() {
        app.requestFullscreen();
    }

    static fullscreenChange(event) {
        if (document.fullscreenElement != null) {
            document.getElementById("fullscreen-open").style.display = "none";
            document.getElementById("fullscreen-close").style.display = "block";
        } else {
            document.getElementById("fullscreen-open").style.display = "block";
            document.getElementById("fullscreen-close").style.display = "none";
        }
    }

    static calculate(event=null) {
        Person.distribute();
        let value = parseInt(document.getElementById("valueinput").value);
        Person.calculateAbsoluteValues(value);
    }
}

document.getElementById("valueinput").oninput = Interface.calculate;
document.onfullscreenchange = Interface.fullscreenChange;

///// Tests

p = new Person("MAIN", false, true)
p.partner = new Person("Partner", false)

p.setParent1(new Person("Father", true))
p.parent1.setParent1(new Person("Grandfather 1", false))
p.parent1.setParent2(new Person("Grandmother 1", true))

p.setParent2(new Person("Mother", false))
p.parent2.setParent1(new Person("Grandfather 2", true))
p.parent2.setParent2(new Person("Grandmother 2", true))

p.parent1.addChild(new Person("Sister 1", true), p.parent2)
p.parent1.addChild(new Person("Sister 2", false))


Person.distribute()
Interface.calculate()
console.log(p)