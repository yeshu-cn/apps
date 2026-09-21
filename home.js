const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Content stays visible without JavaScript and when reduced motion is preferred.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.about-copy').forEach((element) => {
        if (element.getBoundingClientRect().top > window.innerHeight) {
            element.classList.add('reveal-ready');
            observer.observe(element);
        }
    });
}
