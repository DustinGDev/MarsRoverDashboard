let store = {
    user: { name: "Student" },
    apod: '',
    selectedRover: 'curiosity',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    menuActive: false,
    selectedSol: {}
}

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState, preventRerender) => {
    store = Object.assign(store, newState)
    !preventRerender && render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}


// create content
const App = (state) => {
    const { rovers, apod, menuActive, selectedRover } = state

    const navbarClasslistFunction = classListGenerator('nav');

    return `
        <header>
            <img id="hamburger-menu" onclick="toggleMenu()" src="./assets/images/hamburger-menu.svg" />
            <h1>Mars Rover Dashboard</h1>
        </header>
        ${Navigation(rovers, menuActive, navbarClasslistFunction, selectedRover)}
        <main onclick="hideMenu()">
            ${Dashboard(store)}
        </main>
        <footer></footer>
    `
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }

    return `
        <h1>Hello!</h1>
    `
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)

    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

const Navigation = (rovers, menuActive, classListFunction, selectedRover) => {
    const navbarClasses = classListFunction(menuActive);
    const roverClassListGenerator = classListGenerator('nav-rover');

    return `
        <nav onclick="toggleMenu()" class=${navbarClasses.join(' ')}>
            ${rovers.map(rover => `<button class=${roverClassListGenerator(rover, selectedRover).join(' ')} id=${rover.toLowerCase()} onclick="setRover('${rover.toLowerCase()}')">${rover}</button>`).join('')}
        </nav>
        `;
}

const Dashboard = (store) => {
    const { selectedRover, selectedSol } = store;

    const roverData = store[selectedRover] || {};

    if (!roverData.manifest && !roverData.error) {
        getManifest(selectedRover);

        return `<section><p id="loader">Loading ...</p></section>`
    } else if (roverData.error) {
        return APIError(roverData.error)
    } else {
        // TODO: Add filter for different sols and only the most recent one as default
        const sol = selectedSol[selectedRover] ? selectedSol[selectedRover] : roverData.manifest.max_sol;
        const photos = roverData.photos[sol];
        const photoData = roverData.manifest.photos.filter(photoData => photoData.sol === sol)[0];

        const photosData = roverData.manifest.photos;

        return `
            <section>
                <article id="manifest">
                    ${RoverData(roverData.manifest)}
                </article>
                ${DashboardPhotos(photos, selectedRover, sol, photoData, photosData)}
            </section>
            `
    }
}

const DashboardPhotos = (photos, rover, sol, data, allData) => {
    if (photos && photos.error) {
        return APIError(photos.error);
    } else if (photos) {
        return `
            <section id="photo-section">
                <h2>Photos from Sol ${sol}</h2>
                <div>
                    <p>Earth Date: ${data.earth_date}</p>
                    <p>Photo Count: ${data.total_photos}</p>
                    <p>Select The Mars Day: ${DashboardSelectSol(sol, allData)}</p>
                </div>
                ${photos.map(photo => `<img src="${photo.img_src}"/>`).join('')}
            </section>`;
    } else {
        getPhotos(rover, sol)
        return `<section>Loading Photos</section>`;
    }
}

const DashboardSelectSol = (selected, options) => {
    return `
        <select onchange="selectSol(event)">
            ${options.reverse().reduce((prevValue, newValue) => {
                return prevValue + `<option ${newValue.sol === selected ? 'selected="selected"' : ''} value="${newValue.sol}">${newValue.sol}</option>`
            }, '')}
        </select>
    `
}

const RoverData = (data) => {
    return `
        <h2>${data.name} Rover</h2>
        <p>
            <span>Launched on ${data.launch_date}</span>
            <span>Landed on ${data.landing_date}</span>
            <span>Current Status: ${data.status}</span>
        </p>
    `
}

const APIError = (error) => {
    return `
        <section class="api-error">
            <h2>The following error occured during API request</h2>
            <p>${error}</p>
        </section>
    `
}


const classListGenerator = (type) => {
    if (type === 'nav') {
        return (isActive) => {
            const classList = [];
    
            if (isActive) {
                classList.push('active')
            }
    
            return classList
        }
    } else if (type === 'nav-rover') {
        return (rover, selectedRover) => {
            const classList = [];
    
            if (rover.toLowerCase() === selectedRover.toLowerCase()) {
                classList.push('active')
            }
    
            return classList
        }
    }
}

// Event fucntions
const setRover = (rover) => {

    // Timeout for toggle animation
    setTimeout(() => {
        updateStore(store, { selectedRover: rover })
    }, 500)
}

const toggleMenu = () => {
    document.querySelector('nav').classList.toggle('active');

    // Set the state without rerendering the page
    updateStore(store, { menuActive: !store.menuActive }, true)

}

const hideMenu = () => {
    document.querySelector('nav').classList.remove('active');

    // Set the state without rerendering the page
    updateStore(store, { menuActive: false }, true)
}

const selectSol = (event) => {
    updateStore(store, { selectedSol: Object.assign({}, store.selectedSol, { [store.selectedRover]: parseInt(event.target.value) }) })
}

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))
}


const getManifest = (rover) => {

    fetch(`http://localhost:3000/roverData/${rover}`)
        .then(res => res.json())
        .then(data => hasApiError(data))
        .then(data => updateStore(store, { [rover]: { manifest: data.manifest.photo_manifest, photos: {} } }))
        .catch(error => updateStore(store, { [rover]: { error }}))
}

const getPhotos = (rover, sol) => {

    fetch(`http://localhost:3000/photos/${rover}/${sol}`)
        .then(res => res.json())
        .then(data => hasApiError(data))
        .then(photoManifest => updateStore(store, { [rover]: { manifest: store[rover].manifest, photos: Object.assign({}, store[rover].photos, { [sol]: photoManifest.manifest.photos }) } }))
        .catch(error => updateStore(store, { [rover]: { manifest: store[rover].manifest, photos: Object.assign({}, store[rover].photos, { [sol]: { error } }) } }))
}


const hasApiError = (data) => {
    if(data.manifest.error) {
        throw new Error(data.manifest.error.code)
    }

    return data;
}
