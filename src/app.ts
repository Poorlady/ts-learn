// interface for draggable and dragTarget
// interface can be use to be some kind of contract
// in the draggable we need the class to have dragStart and dragEnd event
// in the dragTarget we need the class to have dragOverHandler which will handle the
// draggable item over the dragTarget
// dragLeaveHandler that will handle draggable item when leave
// and dropHandler which will handle the drop of draggable
interface Draggable {
  dragStart(event: DragEvent): void
  dragEnd(event: DragEvent): void
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void
  dropHandler(event: DragEvent): void
  dragLeaveHandler(event: DragEvent): void
}

// Create type of project (id, title, desc, people, status)
enum ProjectStatus {
  Active,
  Finished,
}

// Create type of listener
type Listener<T> = (array: T[]) => void

// create abstract class for projectlist and input
// create parent class of project state
class State<T> {
  protected listeners: Listener<T>[] = []

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn)
  }
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement
  hostElement: T
  element: U

  constructor(
    templateId: string,
    hostId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    const templateElement = document.querySelector(
      `#${templateId}`
    )! as HTMLTemplateElement
    const hostElement = document.querySelector(`#${hostId}`)! as T
    this.element = document.importNode(templateElement.content, true)
      .firstElementChild! as U
    if (newElementId) this.element.id = newElementId
    this.templateElement = templateElement
    this.hostElement = hostElement
    this.attach(insertAtStart)
  }

  private attach(insertAtStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtStart ? 'afterbegin' : 'beforeend',
      this.element
    )
  }

  abstract configure(): void
  abstract renderContent(): void
}

class Project {
  constructor(
    public id: number,
    public title: string,
    public desc: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

class ProjectState extends State<Project> {
  private static instances: ProjectState
  private projects: Project[] = []

  private constructor() {
    super()
  }

  public static getInstance() {
    if (!this.instances) {
      this.instances = new ProjectState()
    }
    return this.instances
  }

  addProject(title: string, desc: string, people: number) {
    // const newObj = {
    //   id: Math.random(),
    //   title,
    //   desc,
    //   people
    // }
    const newObj = new Project(
      Math.random(),
      title,
      desc,
      people,
      ProjectStatus.Active
    )
    this.projects.push(newObj)
    this.updateList()
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find((prj) => prj.id.toString() === projectId)
    if (project && project.status !== newStatus) {
      project.status = newStatus
      this.updateList()
    }
  }

  updateList() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice())
    }
  }
}

const projectState = ProjectState.getInstance()

interface Validatable {
  value: string | number
  isRequired?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
}

function validate(toBeValidate: Validatable) {
  let isValid = true
  let toBeValidateValue = toBeValidate.value.toString().trim().length
  if (toBeValidate.isRequired) {
    isValid = isValid && toBeValidateValue > 0
  }
  if (toBeValidate.maxLength) {
    isValid = isValid && toBeValidateValue <= toBeValidate.maxLength
  }
  if (toBeValidate.minLength) {
    isValid = isValid && toBeValidateValue >= toBeValidate.minLength
  }
  if (toBeValidate.max) {
    isValid = isValid && +toBeValidate.value <= toBeValidate.max
  }
  if (toBeValidate.min) {
    isValid = isValid && +toBeValidate.value >= toBeValidate.min
  }
  return isValid
}

// Autobind Decorator
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  // console.log()
  const originalMethod = descriptor.value
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      // console.log(this)
      const boundFn = originalMethod.bind(this)
      return boundFn
    },
  }
  // console.log(adjDescriptor)
  return adjDescriptor
}

class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  project: Project

  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id.toString())
    this.project = project
    this.renderContent()
    this.configure()
  }

  @autobind
  dragStart(event: DragEvent): void {
    // console.log(event)
    event.dataTransfer!.setData('text/plain', this.project.id.toString())
    event.dataTransfer!.effectAllowed = 'move'
  }

  dragEnd(event: DragEvent): void {
    console.log(event)
  }

  configure() {
    this.element.addEventListener('dragstart', this.dragStart)
    this.element.addEventListener('dragend', this.dragEnd)
  }

  renderContent() {
    this.element.querySelector('h2')!.textContent = this.project.title
    this.element.querySelector('h3')!.textContent =
      this.project.people.toString()
    this.element.querySelector('p')!.textContent = this.project.desc
  }
}

// List Class
// - list class should point to list template
// and render it
// - it has two type finished and active
// - it render the content to h2 and ul in the
// template list
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProjects: Project[]

  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`)
    this.assignedProjects = []
    this.configure()
    this.renderContent()
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault()
      const list = this.element.querySelector('ul')
      list?.classList.add('droppable')
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    const prjId = event.dataTransfer!.getData('text/plain')
    projectState.moveProject(
      prjId,
      this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
    )
  }

  @autobind
  dragLeaveHandler(event: DragEvent): void {
    const list = this.element.querySelector('ul')
    list?.classList.remove('droppable')
  }

  configure() {
    this.element.addEventListener('dragover', this.dragOverHandler)
    this.element.addEventListener('drop', this.dropHandler)
    this.element.addEventListener('dragleave', this.dragLeaveHandler)
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((project) => {
        if (this.type === 'active') {
          return project.status === ProjectStatus.Active
        }
        return project.status === ProjectStatus.Finished
      })
      this.assignedProjects = relevantProjects
      this.renderList()
    })
  }

  renderList() {
    const list = document.querySelector(`#${this.type}-projects-list`)!
    list.innerHTML = ''
    for (const prjItem of this.assignedProjects) {
      // const title = prjItem.title
      // const element = document.createElement('li')
      // element.textContent = title
      // list?.appendChild(element)
      new ProjectItem(this.element.querySelector('ul')!.id, prjItem)
    }
  }

  renderContent() {
    const id = `${this.type}-projects-list`
    this.element.querySelector('ul')!.id = id
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS'
  }
}

// Project Input Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement
  descriptionInputElement: HTMLInputElement
  peopleInputElement: HTMLInputElement

  constructor() {
    super('project-input', 'app', true, 'user-input')
    // console.log(document.importNode(projectInput.content, true), projectInput.content.cloneNode(true))
    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement
    this.peopleInputElement = this.element.querySelector(
      '#people'
    ) as HTMLInputElement

    this.configure()
    // this.attach()
  }

  renderContent(): void {}

  configure() {
    this.element.addEventListener('submit', this.handleSubmission)
    // this.element.addEventListener('submit', this.handleSubmission.bind(this))
  }

  private isEmpty(value: string) {
    return value.trim().length === 0
  }

  private clearInputs() {
    this.titleInputElement.value = ''
    this.descriptionInputElement.value = ''
    this.peopleInputElement.value = ''
  }

  // we want to return tuple but also being able to
  // reutrn nothing
  private validateInputs(): [string, string, number] | void {
    const title = this.titleInputElement.value
    const desc = this.descriptionInputElement.value
    const people = this.peopleInputElement.value
    // console.log(validate({ value: people, isRequired: true, min: 2 })&& validate({ value: title, isRequired: true })&& validate({ value: desc, isRequired: true }))
    // console.log(validate({ value: title, isRequired: true }))
    // console.log(validate({ value: desc, isRequired: true }))

    if (
      !(
        validate({ value: title, isRequired: true }) &&
        validate({ value: desc, isRequired: true }) &&
        validate({ value: people, isRequired: true, min: 2 })
      )
    ) {
      alert('input cannot be empty')
      return
    }

    return [title, desc, +people]
  }

  @autobind
  private handleSubmission(e: Event) {
    // console.log(this)
    e.preventDefault()
    const userInputs = this.validateInputs()
    if (Array.isArray(userInputs)) {
      this.clearInputs()
      const [title, desc, people] = userInputs
      projectState.addProject(title, desc, people)
      // console.log(title, desc, people)
    }
  }

  // private attach() {
  //   this.hostElement.insertAdjacentElement('afterbegin', this.element)
  // }
}

const proInput = new ProjectInput()
const activeList = new ProjectList('active')
const finishedList = new ProjectList('finished')
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
