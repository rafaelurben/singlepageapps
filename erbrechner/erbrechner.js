// Erbrechner by rafaelurben

///// Calculation

class Person {
    // Static fields

    static everyone = [];
    static root = null;
    static money_to_state = false;

    // Static methods

    static resetDistribution() {
        for (let person of this.everyone) {
            person.share_percent = 0;
            person.share_absolute = 0;
            person.min_share_percent = 0;
            person.min_share_absolute = 0;
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
                this.root.distributeToParental2(1 / 1);
            } else if (this.root.isParental3Alive) {
                this.root.distributeToParental3(1 / 1);
            } else {
                this.money_to_state = true;
            }
        }
    }

    // Constructor

    constructor(name, alive, isroot=false) {
        this.name = String(name);
        this.alive = Boolean(alive);

        this.partner = null;

        this.parent1 = null;
        this.parent2 = null;

        this.children = [];

        this.share_percent = 0;
        this.share_absolute = 0;
        this.min_share_percent = 0;
        this.min_share_absolute = 0;

        Person.everyone.push(this);
        if (isroot) Person.root = this;
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

    setParents(parent1, parent2=null) {
        parent1.children.push(child);
        this.parent1 = parent1;

        if (parent2) {
            parent2.children.push(child);
            this.parent2 = parent2;
        }
    }

    addChild(child, parent2=null) {
        this.children.push(child);
        child.parent1 = this;
        
        if (parent2) {
            parent2.children.push(child);
            child.parent2 = parent2;
        };
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

///// Tests

// p = new Person("MAIN", false, true)
// p.partner = new Person("Partner", false)

// p.parent1 = new Person("Father", false)
// p.parent1.parent1 = new Person("Grandfather 1", false)
// p.parent1.parent2 = new Person("Grandmother 1", true)

// p.parent2 = new Person("Mother", false)
// p.parent2.parent1 = new Person("Grandfather 2", true)
// p.parent2.parent2 = new Person("Grandmother 2", true)

// p.parent1.addChild(new Person("Sister 1", true), p.parent2)
// p.parent1.addChild(new Person("Sister 2", false))


// Person.distribute()