window.addEventListener('DOMContentLoaded', event => {
    var observer = new IntersectionObserver(onIntersection, {
        root: null,   // default is the viewport
        threshold: [0.1, 0.32, 0.52, 0.8, 1] // percentage of target's visible area. Triggers "onIntersection"
    })

    // callback is called on intersection change
    function onIntersection(entries, opts){
        const navbarCollapsible = document.body.querySelector('#mainNav');
        const logo = document.getElementById('logo');
        if (!navbarCollapsible) {
            return;
        }

        entries.forEach(entry => {
            if (entry.intersectionRatio == 1) {
                navbarCollapsible.classList.remove('navbar-landing-shrink')
                navbarCollapsible.classList.add('navbar-landing-expand')
                navbarCollapsible.setAttribute('data-bs-theme', 'light')
                logo.classList.remove('stepO', 'stepTw', 'stepTh', 'stepF')

                return;
            }

            navbarCollapsible.classList.add('navbar-landing-shrink')
            navbarCollapsible.classList.remove('navbar-landing-expand')
            navbarCollapsible.removeAttribute('data-bs-theme')

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

    //  Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
            smoothScroll: true
        });
    };

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

});
