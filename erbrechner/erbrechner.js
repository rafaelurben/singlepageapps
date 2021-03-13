// Erbrechner by rafaelurben

///// Calculation

class Person {
    all_people = [];
    money_to_state = false;

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

        this.all_people.push(this);
    }

    // Properties

    /// Parentals

    get isParental1Alive() {
        for (var child of this.children) {
            if (child.isTreeAlive) return true;
        }
        return false;
    }

    get isParental2Alive() {
        return (this.parent1 != null && this.parent1.isTreeAlive) || (this.parent2 != null && this.parent2.isTreeAlive);
    }

    get isParental3Alive() {
        return (this.parent1 != null && this.parent1.isParental2Alive) || (this.parent2 != null && this.parent2.isParental2Alive)
    }

    /// Helpers

    get isTreeAlive() {
        return this.alive || this.isParental1Alive;
    }

    get childrenWithTreeAlive() {
        var list = [];
        for (child of this.children) {
            if (child.isTreeAlive) {
                list.push(child);
            }
        }
        return list;
    }

    // Methods

    addChild(child) {
        this.children.push(child);
    }

    distribute() {
        if (this.partner != null && this.partner.alive) {
            if (this.isParental1Alive) {
                this.partner.share_percent = 1/2;
                this.partner.min_share_percent = (1/2)*(1/2);

                this.subDistribute(1/2, mandatorypart=3/4, ignorealive=true);
            } else if (this.isParental2Alive) {
                this.partner.share_percent = 3/4;
                this.partner.min_share_percent = (3/4)*(1/2);
                

            } else {
                this.partner.share_percent = 1/1;
                this.partner.min_share_percent = (1/1)*(1/2);


            }
        } else {

        }
    }

    subDistribute(percent, mandatorypart=0, ignorealive=false) {
        if (this.alive && !ignorealive) {
            this.share_percent = percent;
            this.min_share_percent = percent*mandatorypart;
        } else {
            people_to_share_with = this.childrenWithTreeAlive;
            percent_per_person = percent / people_to_share_with.length;
            for (person of people_to_share_with) {
                person.subDistribute(percent_per_person, mandatorypart);
            }
        }
    }
}

///// Interface

p = new Person("MAIN", true)
p.parent1 = new Person("Father", true)
p.parent1.parent1 = new Person("Grandfather 1", false)
p.parent1.parent2 = new Person("Grandmother 1", false)
p.parent1.parent2.addChild(new Person("Uncle 1", true));
p.parent2 = new Person("Mother", false)
p.parent2.parent1 = new Person("Grandfather 2", false)
p.parent2.parent2 = new Person("Grandmother 2", false)
p.addChild(new Person("Child 1", true))
p.addChild(new Person("Child 1", true))