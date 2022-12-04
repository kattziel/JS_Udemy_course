class DOMHelper {
  static clearEventListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.replaceWith(clonedElement);
    return clonedElement;
  }
  // klasa "czyści" event listenera, tj. w pierwszej kolejności robi kopię elementu, na którym wywołaliśmy addEventListenera, a w dalszej kolejności podmienia ten element, zeby kolejny addEventListener wywołał się na nowym elemencie (nie mamy podwójnego wywołania addEventListenera na tym samym elemencie = nie otrzymujemy niechcianych efektów)

  static moveElement(elementId, newDestinationSelector) {
    const element = document.getElementById(elementId);
    const destinationElement = document.querySelector(newDestinationSelector);
    destinationElement.append(element);
    element.scrollIntoView({ behavior: "smooth" });
  }
  // dzięki tej funkcji dokonujemy zmian w DOM, tj. elementem jest ten node, który ma podane ID, dalej wyszukujemy element o określonym selektorze i dodajemy do tego drugiego elementu (selector) ten pierwszy (id);
}

class Component {
  constructor(hostElementId, insertBefore = false) {
    if (hostElementId) {
      this.hostElement = document.getElementById(hostElementId);
    } else {
      this.hostElement = document.body;
    }
    this.insertBefore = insertBefore;
  }
  // klasa pomocnicza; ustalamy w niej, czy mamy do czynienia z hostElementId; jezeli mamy, wówczas element, jakim jest komentarz, dodajemy do elementu o danym id; jezeli nie mamy - wówczas dodajemy ten element do body dokumentu;

  detach() {
    if (this.element) {
      this.element.remove();
      // this.element.parentElement.removeChild(this.element);
    }
  }

  attach() {
    this.hostElement.insertAdjacentElement(
      this.insertBefore ? "afterbegin" : "beforeend",
      this.element
    );
  }
  // te funkcje wywołane w obiektach powstałych na bazie class Component pozwalają dodawać oraz usuwać poszczególne elementy z projektu; w projekcie uzywane w celu wyświetlenia dodatkowych informacji / usunięcia ich (Tooltip)
}

class Tooltip extends Component {
  constructor(closeNotifierFunction, text, hostElementId) {
    super(hostElementId);
    this.closeNotifier = closeNotifierFunction;
    this.text = text;
    this.create();
  }

  closeTooltip = () => {
    this.detach();
    this.closeNotifier();
  };

  create() {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'card';
    const tooltipTemplate = document.getElementById('tooltip');
    const tooltipBody = document.importNode(tooltipTemplate.content, true);
    tooltipBody.querySelector('p').textContent = this.text;
    tooltipElement.append(tooltipBody);
    // tworzymy div, w którym przy pomocy template osadzonego w HTML o id 'tooltip', znajdą się określone informacje

    const hostElPosLeft = this.hostElement.offsetLeft;
    const hostElPosTop = this.hostElement.offsetTop;
    const hostElHeight = this.hostElement.clientHeight;
    const parentElementScrolling = this.hostElement.parentElement.scrollTop;

    const x = hostElPosLeft + 20;
    // to juz jest w px, tak jak parametry wskazane w console.logu
    // nie mogę sobie przypisać parametru offset, to jest readonly
    const y = hostElPosTop + hostElHeight - parentElementScrolling - 10;

    tooltipElement.style.position = "absolute";
    tooltipElement.style.left = x + "px";
    tooltipElement.style.top = y + "px";
    // regulujemy scrollowanie i pozycjonowanie elementu po scrollowaniu w dół

    console.log(this.hostElement.getBoundingClientRect());
    tooltipElement.addEventListener("click", this.closeTooltip);
    this.element = tooltipElement;
  }

  // klasa Tooltip przyjmuje w konstruktorze funkcję notyfikującą; poprzez super() moze równiez korzystac z parametrów / metod zawartych w class Component; zawiera metody umozliwiajace na stworzenie tooltipu oraz zamknięcie go;
}

class ProjectItem {
  hasActiveTooltip = false;

  constructor(id, updateProjectListsFunction, type) {
    this.id = id;
    this.updateProjectListsHandler = updateProjectListsFunction;
    // ilekroć będziemy w tej class mówic o updateProjectListsHandler, nalezy przez to rozumieć updateProjectListsFunction;
    this.connectMoreInfoButton();
    this.connectSwitchButton(type);
  }

  showMoreInfoHandler() {
    // triggered kiedy klikam moreinfo button
    if (this.hasActiveTooltip) {
      return;
    }
    const projectElement = document.getElementById(this.id);
    const tooltipText = projectElement.dataset.extraInfo;
    const tooltip = new Tooltip(
      () => {
        this.hasActiveTooltip = false;
      },
      tooltipText,
      this.id
    );
    tooltip.attach();
    this.hasActiveTooltip = true;
    // zastosowanie na tooltip funkcji attach powoduje zmianę statusu hasActiveValue na true;
  }

  connectMoreInfoButton() {
    const projectItemElement = document.getElementById(this.id);
    const moreInfoBtn = projectItemElement.querySelector(
      "button:first-of-type"
    );
    moreInfoBtn.addEventListener("click", this.showMoreInfoHandler.bind(this));
    // na konkretny button, znajdujący się w elemencie o określonym id, nadajemy aEL z funkcją dotyczącą pokazania większej ilości informacji
  }

  connectSwitchButton(type) {
    const projectItemElement = document.getElementById(this.id);
    let switchBtn = projectItemElement.querySelector("button:last-of-type");
    switchBtn = DOMHelper.clearEventListeners(switchBtn);
    switchBtn.textContent = type === "active" ? "Finish" : "Activate";
    switchBtn.addEventListener(
      "click",
      this.updateProjectListsHandler.bind(null, this.id)
    );
    // wyszukujemy element o określonym id; na tym elemencie wyszukujemy buttona, do którego dodajemy addEventListnera; naciśnięcie powoduje, ze dochodzi do zaktualizowania listy projektów; dochodzi do przeniesienia danego projektu z active do finished, zmiany textContent z active na finished + z uwagi na funkcję czyszczącą, jak naciśniemy ponownie ten sam przycisk (tylko z napisem finished - z uwagi na zmianę), drugi raz nie wykona się nam ta sama funkcja
  }

  update(updateProjectListsFn, type) {
    this.updateProjectListsHandler = updateProjectListsFn;
    this.connectSwitchButton(type);
  }
}

class ProjectList {
  projects = [];

  constructor(type) {
    this.type = type;
    const prjItems = document.querySelectorAll(`#${type}-projects li`);
    for (const prjItem of prjItems) {
      this.projects.push(
        new ProjectItem(prjItem.id, this.switchProject.bind(this), this.type)
      );
    }
    console.log(this.projects);
  }

  setSwitchHandlerFunction(switchHandlerFunction) {
    this.switchHandler = switchHandlerFunction;
  }

  addProject(project) {
    this.projects.push(project);
    DOMHelper.moveElement(project.id, `#${this.type}-projects ul`);
    project.update(this.switchProject.bind(this), this.type);
  }

  switchProject(projectId) {
    // const projectIndex = this.projects.findIndex(p => p.id === projectId);
    // this.projects.splice(projectIndex, 1);
    this.switchHandler(this.projects.find((p) => p.id === projectId));
    this.projects = this.projects.filter((p) => p.id !== projectId);
  }
}

class App {
  static init() {
    const activeProjectsList = new ProjectList("active");
    const finishedProjectsList = new ProjectList("finished");
    activeProjectsList.setSwitchHandlerFunction(
      finishedProjectsList.addProject.bind(finishedProjectsList)
    );
    finishedProjectsList.setSwitchHandlerFunction(
      activeProjectsList.addProject.bind(activeProjectsList)
    );

    const someScript = document.createElement('script');
    someScript.textContent = 'alert ("Hi there!");';
    document.head.append(someScript);
  }
}

App.init();
