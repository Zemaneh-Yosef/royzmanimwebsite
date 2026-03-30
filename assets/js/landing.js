
var observer = new IntersectionObserver(onIntersection, {
    root: null,   // default is the viewport
    threshold: [0.1, 0.32, 0.52, 0.8, 1] // percentage of target's visible area. Triggers "onIntersection"
})

const navBarElem = document.getElementById('mainNav');
const navBarCollapse = document.getElementById('navbarResponsive');
const logo = document.getElementById('logo');

// callback is called on intersection change
function onIntersection(entries, opts){
    if (!navBarElem) {
        return;
    }

    entries.forEach(entry => {
        if (entry.intersectionRatio == 1) {
            navBarElem.classList.remove('navbar-landing-shrink')
            navBarElem.classList.add('navbar-landing-expand')
            logo.classList.remove('stepO', 'stepTw', 'stepTh', 'stepF')

            return;
        }

        navBarElem.classList.add('navbar-landing-shrink')
        navBarElem.classList.remove('navbar-landing-expand')

        if (entry.intersectionRatio <= .1) {
            logo.classList.add('stepF')
            logo.classList.remove('stepO', 'stepTw', 'stepTh')
        } else if (entry.intersectionRatio <= .32) {
            logo.classList.add('stepTh')
            logo.classList.remove('stepO', 'stepTw', 'stepF')
        } else if (entry.intersectionRatio <= .52) {
            logo.classList.remove('stepO', 'stepTh', 'stepF')
            logo.classList.add('stepTw')
        } else {
            logo.classList.remove('stepTh', 'stepTw', 'stepF')
            logo.classList.add('stepO')
        }
    })
}

// Use the observer to observe an element
observer.observe( document.getElementById('fakeLogo') )

// Collapse responsive navbar when toggler is visible
const navbarToggler = document.body.querySelector('.navbar-toggler');
const responsiveNavItems = [].slice.call(
    document.querySelectorAll('#navbarResponsive .nav-link')
);
responsiveNavItems.map(function (responsiveNavItem) {
    responsiveNavItem.addEventListener('click', () => {
        if (window.getComputedStyle(navbarToggler).display !== 'none') {
            navbarToggler.click();
        }
    });
});

navBarCollapse.addEventListener('show.bs.collapse', () => { logo.style.width = '30vw'; logo.style.top = '.5em'; })
navBarCollapse.addEventListener('hide.bs.collapse', () => { ['width', 'top'].forEach(prop => logo.style.removeProperty(prop)); })

if (document.readyState !== 'loading') {
    postInit();
} else {
    window.addEventListener('DOMContentLoaded', event => postInit());
}

function postInit() {
    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
            smoothScroll: true
        });
    };

    for (const modal of document.getElementsByClassName('modal')) {
        modal.addEventListener('hide.bs.modal', () => logo.style.removeProperty('display'));
        modal.addEventListener('show.bs.modal', () => logo.style.display = 'none');
    }
}