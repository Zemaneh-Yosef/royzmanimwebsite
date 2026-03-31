// @ts-check

const navBarElem     = document.getElementById('mainNav');
const navBarCollapse = document.getElementById('navbarResponsive');
const logo           = document.getElementById('logo');

// Safari fallback — set --scroll-ratio for browsers without animation-timeline support
const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');

if (!supportsScrollTimeline) {
    window.addEventListener('scroll', () => {
        const ratio = Math.min(window.scrollY / 400, 1);
        document.documentElement.style.setProperty('--scroll-ratio', ratio);
    }, { passive: true });
}

// Navbar shrink/expand on scroll
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 80;
    navBarElem?.classList.toggle('navbar-landing-shrink', scrolled);
    navBarElem?.classList.toggle('navbar-landing-expand', !scrolled);
}, { passive: true });

// Collapse navbar on mobile nav-link click
const navbarToggler = document.querySelector('.navbar-toggler');
document.querySelectorAll('#navbarResponsive .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.getComputedStyle(navbarToggler).display !== 'none') {
            navbarToggler.click();
        }
    });
});

// Override logo size when mobile nav is open
navBarCollapse.addEventListener('show.bs.collapse', () => {
    logo.style.width = '30vw';
    logo.style.top   = '.5em';
    navBarElem.classList.add('navbar-landing-shrink');
    navBarElem.classList.remove('navbar-landing-expand');
});
navBarCollapse.addEventListener('hide.bs.collapse', () => {
    logo.style.removeProperty('width');
    logo.style.removeProperty('top');
    if (window.scrollY <= 80) {
        navBarElem.classList.remove('navbar-landing-shrink');
        navBarElem.classList.add('navbar-landing-expand');
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', postInit);
} else {
    postInit();
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