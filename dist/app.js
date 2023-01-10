"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// Create type of project (id, title, desc, people, status)
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
// create abstract class for projectlist and input
// create parent class of project state
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
class Component {
    constructor(templateId, hostId, insertAtStart, newElementId) {
        const templateElement = document.querySelector(`#${templateId}`);
        const hostElement = document.querySelector(`#${hostId}`);
        this.element = document.importNode(templateElement.content, true)
            .firstElementChild;
        if (newElementId)
            this.element.id = newElementId;
        this.templateElement = templateElement;
        this.hostElement = hostElement;
        this.attach(insertAtStart);
    }
    attach(insertAtStart) {
        this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element);
    }
}
class Project {
    constructor(id, title, desc, people, status) {
        this.id = id;
        this.title = title;
        this.desc = desc;
        this.people = people;
        this.status = status;
    }
}
class ProjectState extends State {
    constructor() {
        super();
        this.projects = [];
    }
    static getInstance() {
        if (!this.instances) {
            this.instances = new ProjectState();
        }
        return this.instances;
    }
    addProject(title, desc, people) {
        // const newObj = {
        //   id: Math.random(),
        //   title,
        //   desc,
        //   people
        // }
        const newObj = new Project(Math.random(), title, desc, people, ProjectStatus.Active);
        this.projects.push(newObj);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
const projectState = ProjectState.getInstance();
function validate(toBeValidate) {
    let isValid = true;
    let toBeValidateValue = toBeValidate.value.toString().trim().length;
    if (toBeValidate.isRequired) {
        isValid = isValid && toBeValidateValue > 0;
    }
    if (toBeValidate.maxLength) {
        isValid = isValid && toBeValidateValue <= toBeValidate.maxLength;
    }
    if (toBeValidate.minLength) {
        isValid = isValid && toBeValidateValue >= toBeValidate.minLength;
    }
    if (toBeValidate.max) {
        isValid = isValid && +toBeValidate.value <= toBeValidate.max;
    }
    if (toBeValidate.min) {
        isValid = isValid && +toBeValidate.value >= toBeValidate.min;
    }
    return isValid;
}
// Autobind Decorator
function autobind(_, _2, descriptor) {
    // console.log()
    const originalMethod = descriptor.value;
    const adjDescriptor = {
        configurable: true,
        get() {
            // console.log(this)
            const boundFn = originalMethod.bind(this);
            return boundFn;
        },
    };
    // console.log(adjDescriptor)
    return adjDescriptor;
}
class ProjectItem extends Component {
    constructor(hostId, project) {
        super('single-project', hostId, false, project.id.toString());
        this.project = project;
        this.renderContent();
        this.configure();
    }
    dragStart(event) {
        console.log(event);
        event.dataTransfer.setData('text/plain', this.project.id.toString());
        event.dataTransfer.effectAllowed = 'move';
    }
    dragEnd(event) {
        console.log(event);
    }
    configure() {
        this.element.addEventListener('dragstart', this.dragStart);
        this.element.addEventListener('dragend', this.dragEnd);
    }
    renderContent() {
        this.element.querySelector('h2').textContent = this.project.title;
        this.element.querySelector('h3').textContent =
            this.project.people.toString();
        this.element.querySelector('p').textContent = this.project.desc;
    }
}
__decorate([
    autobind
], ProjectItem.prototype, "dragStart", null);
// List Class
// - list class should point to list template
// and render it
// - it has two type finished and active
// - it render the content to h2 and ul in the
// template list
class ProjectList extends Component {
    constructor(type) {
        super('project-list', 'app', false, `${type}-projects`);
        this.type = type;
        this.assignedProjects = [];
        this.configure();
        this.renderContent();
    }
    dragOverHandler(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const list = this.element.querySelector('ul');
            list === null || list === void 0 ? void 0 : list.classList.add('droppable');
        }
    }
    dropHandler(event) {
    }
    dragLeaveHandler(event) {
        const list = this.element.querySelector('ul');
        list === null || list === void 0 ? void 0 : list.classList.remove('droppable');
    }
    configure() {
        this.element.addEventListener("dragover", this.dragOverHandler);
        this.element.addEventListener("drop", this.dropHandler);
        this.element.addEventListener("dragleave", this.dragLeaveHandler);
        projectState.addListener((projects) => {
            const relevantProjects = projects.filter((project) => {
                if (this.type === 'active') {
                    return project.status === ProjectStatus.Active;
                }
                return project.status === ProjectStatus.Finished;
            });
            this.assignedProjects = relevantProjects;
            this.renderList();
        });
    }
    renderList() {
        const list = document.querySelector(`#${this.type}-projects-list`);
        list.innerHTML = '';
        for (const prjItem of this.assignedProjects) {
            // const title = prjItem.title
            // const element = document.createElement('li')
            // element.textContent = title
            // list?.appendChild(element)
            new ProjectItem(this.element.querySelector('ul').id, prjItem);
        }
    }
    renderContent() {
        const id = `${this.type}-projects-list`;
        this.element.querySelector('ul').id = id;
        this.element.querySelector('h2').textContent =
            this.type.toUpperCase() + ' PROJECTS';
    }
}
__decorate([
    autobind
], ProjectList.prototype, "dragOverHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dragLeaveHandler", null);
// Project Input Class
class ProjectInput extends Component {
    constructor() {
        super('project-input', 'app', true, 'user-input');
        // console.log(document.importNode(projectInput.content, true), projectInput.content.cloneNode(true))
        this.titleInputElement = this.element.querySelector('#title');
        this.descriptionInputElement = this.element.querySelector('#description');
        this.peopleInputElement = this.element.querySelector('#people');
        this.configure();
        // this.attach()
    }
    renderContent() { }
    configure() {
        this.element.addEventListener('submit', this.handleSubmission);
        // this.element.addEventListener('submit', this.handleSubmission.bind(this))
    }
    isEmpty(value) {
        return value.trim().length === 0;
    }
    clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }
    // we want to return tuple but also being able to
    // reutrn nothing
    validateInputs() {
        const title = this.titleInputElement.value;
        const desc = this.descriptionInputElement.value;
        const people = this.peopleInputElement.value;
        // console.log(validate({ value: people, isRequired: true, min: 2 })&& validate({ value: title, isRequired: true })&& validate({ value: desc, isRequired: true }))
        // console.log(validate({ value: title, isRequired: true }))
        // console.log(validate({ value: desc, isRequired: true }))
        if (!(validate({ value: title, isRequired: true }) &&
            validate({ value: desc, isRequired: true }) &&
            validate({ value: people, isRequired: true, min: 2 }))) {
            alert('input cannot be empty');
            return;
        }
        return [title, desc, +people];
    }
    handleSubmission(e) {
        // console.log(this)
        e.preventDefault();
        const userInputs = this.validateInputs();
        if (Array.isArray(userInputs)) {
            this.clearInputs();
            const [title, desc, people] = userInputs;
            projectState.addProject(title, desc, people);
            // console.log(title, desc, people)
        }
    }
}
__decorate([
    autobind
], ProjectInput.prototype, "handleSubmission", null);
const proInput = new ProjectInput();
const activeList = new ProjectList('active');
const finishedList = new ProjectList('finished');
// console.log(proInput)
// const appContainer = <HTMLDivElement>document.querySelector("#app")
// const projectInput = document.querySelector("#project-input") as HTMLTemplateElement
// console.log(appContainer, projectInput)
// window.onload = (event) => {
//     const cloneInput = projectInput.content.cloneNode(true)
//     appContainer.appendChild(cloneInput)
// }
// create a state class
// its a singleton class
// its also have a listeners array
// that can be called after changes in the array
//# sourceMappingURL=app.js.map