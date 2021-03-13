// Erbrechner by rafaelurben

///// Calculation

class Person {
    static everyone = [];
    static money_to_state = false;

    constructor(name, alive) {
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

    distribute() {
        if (this.partner && this.partner.alive) {
            if (this.isParental1Alive) {
                this.partner.share_percent = 1/2;
                this.partner.min_share_percent = (1/2)*(1/2);

                this.distributeToParental1(1/2, 3/4, true);
            } else if (this.isParental2Alive) {
                this.partner.share_percent = 3/4;
                this.partner.min_share_percent = (3/4)*(1/2);

                this.distributeToParental2(1/4, 1/2)
            } else {
                this.partner.share_percent = 1/1;
                this.partner.min_share_percent = (1/1)*(1/2);
            }
        } else {
            if (this.isParental1Alive) {
                this.distributeToParental1(1/1, 1/2, true);
            } else if (this.isParental2Alive) {
                this.distributeToParental2(1/1);
            } else if (this.isParental3Alive) {
                this.distributeToParental3(1/1);
            } else {
                Person.money_to_state = true;
            }
        }
    }
}

///// Interface

///// Tests

// p = new Person("MAIN", false)
// p.partner = new Person("Partner", false)

// p.parent1 = new Person("Father", false)
// p.parent1.parent1 = new Person("Grandfather 1", false)
// p.parent1.parent2 = new Person("Grandmother 1", true)

// p.parent2 = new Person("Mother", false)
// p.parent2.parent1 = new Person("Grandfather 2", true)
// p.parent2.parent2 = new Person("Grandmother 2", true)

// p.parent1.addChild(new Person("Sister 1", true), p.parent2)
// p.parent1.addChild(new Person("Sister 2", false))


// p.distribute()