let store = {
    user: { name: "Student" },
    apod: '',
    selectedRover: 'curiosity',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
}

// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}


// create content
const App = (state) => {
    let { rovers, apod } = state

    return `
        <header></header>
        ${Navigation(rovers)}
        <main>
            ${Greeting(store.user.name)}
            <section>
                <h3>Put things on the page!</h3>
                <p>Here is an example section.</p>
                <p>
                    One of the most popular websites at NASA is the Astronomy Picture of the Day. In fact, this website is one of
                    the most popular websites across all federal agencies. It has the popular appeal of a Justin Bieber video.
                    This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other
                    applications. In addition, if the concept_tags parameter is set to True, then keywords derived from the image
                    explanation are returned. These keywords could be used as auto-generated hashtags for twitter or instagram feeds;
                    but generally help with discoverability of relevant imagery.
                </p>
                ${ImageOfTheDay(apod)}
            </section>
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
    console.log(photodate.getDate(), today.getDate());

    console.log(photodate.getDate() === today.getDate());
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

const Navigation = (rovers) => {
    return `<nav>${rovers.map(rover => `<button id=${rover.toLowerCase()} onclick="setRover('${rover.toLowerCase()}')">${rover}</button>`).join('')}</nav>`;
}

const Dashboard = (store) => {
    const { selectedRover } = store;

    const roverData = store[selectedRover] || {};

    if (!roverData.manifest) {
        getManifest(selectedRover);

        return `<section><p id="loader">Loading ...</p></section>`
    } else {
        // TODO: Add filter for different sols and only the most recent one as default
        const sol = roverData.manifest.photos[roverData.manifest.photos.length-1].sol;
        const photos = roverData.photos[sol];

        return `
            <section>
                <article id="manifest">
                    <h1>Rover Data</h1>
                </article>
                ${DashboardPhotos(photos, selectedRover, sol)}
            </section>
            `
    }
}

const DashboardPhotos = (photos, rover, sol) => {
    if (photos) {
        return `<section>${photos.map(photo => `<img src="${photo.img_src}"/>`).join('')}</section>`
    } else {
        getPhotos(rover, sol)
        return `<section>Loading Photos</section>`
    }
}

const setRover = (rover) => {
    updateStore(store, { selectedRover: rover })
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
        .then(data => updateStore(store, { [rover]: { manifest: data.manifest.photo_manifest, photos: {} } }))
}

const getPhotos = (rover, sol) => {

    fetch(`http://localhost:3000/photos/${rover}/${sol}`)
        .then(res => res.json())
        .then(photoManifest => updateStore(store, { [rover]: { manifest: store[rover].manifest, photos: Object.assign({}, store[rover].photos, { [sol]: photoManifest.manifest.photos }) } }))
}
