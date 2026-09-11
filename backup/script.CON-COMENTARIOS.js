/* ==========================================================================
   Portafolio · Jheymy Barboza
   ========================================================================== */
(() => {
    'use strict';

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------------------
       1. Tema claro / oscuro
       ---------------------------------------------------------------------- */
    const THEME_KEY = 'portafolio-theme';
    const root = document.documentElement;
    const themeMeta = $('meta[name="theme-color"]');

    const applyTheme = (theme) => {
        root.setAttribute('data-theme', theme);
        if (themeMeta) themeMeta.content = theme === 'light' ? '#f6f6fb' : '#07070c';
    };

    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme) {
        applyTheme(storedTheme);
    } else {
        applyTheme(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    }

    $('#themeToggle')?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
    });

    /* ----------------------------------------------------------------------
       2. Texto que se escribe solo (roles rotativos)
       ---------------------------------------------------------------------- */
    const typedEl = $('#typedText');

    if (typedEl) {
        const roles = [
            'Desarrollador Web',
            'Estudiante de Ing. de Sistemas',
            'Frontend con JS y Bootstrap',
            'Backend con Node.js y MySQL'
        ];

        if (reduceMotion) {
            typedEl.textContent = roles[0];
        } else {
            let roleIndex = 0;
            let charIndex = 0;
            let deleting = false;

            const type = () => {
                const current = roles[roleIndex];
                charIndex += deleting ? -1 : 1;
                typedEl.textContent = current.slice(0, charIndex);

                let delay = deleting ? 45 : 85;

                if (!deleting && charIndex === current.length) {
                    deleting = true;
                    delay = 1900;
                } else if (deleting && charIndex === 0) {
                    deleting = false;
                    roleIndex = (roleIndex + 1) % roles.length;
                    delay = 350;
                }

                setTimeout(type, delay);
            };

            type();
        }
    }

    /* ----------------------------------------------------------------------
       3. Navbar: fondo al hacer scroll + barra de progreso
       ---------------------------------------------------------------------- */
    const navbar = $('#navbar');
    const progress = $('#scrollProgress');
    const btnTop = $('#btnTop');

    const onScroll = () => {
        const y = window.scrollY;
        navbar?.classList.toggle('is-scrolled', y > 40);
        btnTop?.classList.toggle('show', y > 500);

        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btnTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    /* ----------------------------------------------------------------------
       4. Link activo del menú según la sección visible
       ---------------------------------------------------------------------- */
    const navLinks = $$('.nav-link-custom');
    const sections = navLinks
        .map(link => $(link.getAttribute('href')))
        .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(section => spy.observe(section));
    }

    /* Cierra el menú móvil al elegir una opción */
    const navCollapse = $('#navbarContent');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navCollapse?.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
            }
        });
    });

    /* ----------------------------------------------------------------------
       5. Aparición de elementos al hacer scroll
       ---------------------------------------------------------------------- */
    const revealEls = $$('[data-reveal]');

    if (!reduceMotion && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    /* ----------------------------------------------------------------------
       6. Luz que sigue al cursor en las tarjetas
       ---------------------------------------------------------------------- */
    if (window.matchMedia('(hover: hover)').matches) {
        $$('.card-glass').forEach(card => {
            card.addEventListener('pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
                card.style.setProperty('--my', `${e.clientY - rect.top}px`);
            });
        });
    }

    /* ----------------------------------------------------------------------
       7. Marquee infinito (duplica el contenido para el loop)
       ---------------------------------------------------------------------- */
    const group = $('#marqueeGroup');
    if (group) {
        /* Se clona el grupo entero (no el innerHTML) para que el track tenga
           dos bloques de ancho idéntico y el bucle empalme exacto. */
        const copia = group.cloneNode(true);
        copia.removeAttribute('id');
        copia.setAttribute('aria-hidden', 'true');
        group.parentNode.appendChild(copia);
    }

    /* ----------------------------------------------------------------------
       8. WhatsApp
       ---------------------------------------------------------------------- */
    const TELEFONO = '51942231107';
    const MENSAJE = 'Hola Jheymy, buen día. Estoy interesado(a) en el desarrollo de una página web y me gustaría recibir información sobre tus servicios, costos y tiempos de entrega. Quedo atento a tu respuesta.';

    $('#btnWhatsApp')?.addEventListener('click', () => {
        window.open(`https://wa.me/${TELEFONO}?text=${encodeURIComponent(MENSAJE)}`, '_blank', 'noopener');
    });

    /* ----------------------------------------------------------------------
       9. Formulario de contacto: validación + confirmación + envío
       ---------------------------------------------------------------------- */
    const form = $('#contactForm');

    if (form) {
        const modalEl = $('#modalFormulario');
        const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
        const fields = $$('.form-control-custom', form);

        const MESSAGES = {
            nombre: { hint: 'Ej. Jorge Delgado Díaz', error: 'Escribe tu nombre completo (mínimo 3 caracteres)' },
            correo: { hint: 'Ej. ejemplo@hotmail.com', error: 'Ingresa un correo electrónico válido' },
            mensaje: { hint: 'Mínimo 10 caracteres', error: 'Cuéntame un poco más (mínimo 10 caracteres)' }
        };

        const validateField = (field) => {
            const msgEl = field.parentElement.querySelector('[data-msg]');
            const copy = MESSAGES[field.id] || { hint: '', error: 'Este campo es obligatorio' };
            const valid = field.checkValidity();
            const touched = field.value.trim().length > 0;

            field.classList.toggle('is-invalid', !valid && touched);
            field.classList.toggle('is-valid', valid && touched);

            if (msgEl) msgEl.textContent = !valid && touched ? copy.error : copy.hint;

            return valid;
        };

        fields.forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.classList.contains('is-invalid') || field.value.trim()) validateField(field);
            });
        });

        /* El submit abre el modal de confirmación en lugar de enviar directo */
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const firstInvalid = fields.find(field => !validateField(field) || !field.value.trim());

            if (firstInvalid) {
                fields.forEach(field => {
                    field.classList.toggle('is-invalid', !field.checkValidity());
                    const msgEl = field.parentElement.querySelector('[data-msg]');
                    const copy = MESSAGES[field.id];
                    if (msgEl && copy) msgEl.textContent = field.checkValidity() ? copy.hint : copy.error;
                });
                firstInvalid.focus();
                return;
            }

            modal ? modal.show() : form.submit();
        });

        /* Confirmación dentro del modal */
        $('#btnEnviar')?.addEventListener('click', () => {
            modal?.hide();

            if (typeof Swal === 'undefined') {
                form.submit();
                return;
            }

            Swal.fire({
                title: '¡Mensaje enviado!',
                text: 'Gracias por escribirme, te responderé lo antes posible.',
                icon: 'success',
                confirmButtonText: 'Perfecto',
                confirmButtonColor: '#7c5cff',
                background: root.getAttribute('data-theme') === 'light' ? '#ffffff' : '#0d0d16',
                color: root.getAttribute('data-theme') === 'light' ? '#14141f' : '#ececf5'
            }).then(() => form.submit());
        });
    }

    /* ----------------------------------------------------------------------
       10. Año del footer
       ---------------------------------------------------------------------- */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ----------------------------------------------------------------------
       11. Títulos que se revelan palabra por palabra
       ---------------------------------------------------------------------- */
    const titles = $$('.hero-title, .section-title');

    if (titles.length && !reduceMotion) {

        /* Envuelve cada palabra sin destruir los <span> y <br> que ya existen */
        const wrapWords = (node, counter) => {
            [...node.childNodes].forEach(child => {

                if (child.nodeType === Node.TEXT_NODE) {
                    if (!child.textContent.trim()) return;

                    const frag = document.createDocumentFragment();

                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;

                        if (!part.trim()) {
                            frag.appendChild(document.createTextNode(part));
                            return;
                        }

                        const outer = document.createElement('span');
                        outer.className = 'word';

                        const inner = document.createElement('span');
                        inner.className = 'word__in';
                        inner.textContent = part;
                        inner.style.setProperty('--wd', `${counter.i * 70}ms`);
                        counter.i++;

                        outer.appendChild(inner);
                        frag.appendChild(outer);
                    });

                    child.replaceWith(frag);

                } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
                    wrapWords(child, counter);
                }
            });
        };

        titles.forEach(title => {
            wrapWords(title, { i: 0 });
            /* El propio título deja de usar el reveal genérico:
               de la animación se encargan las palabras. */
            title.removeAttribute('data-reveal');
        });

        if ('IntersectionObserver' in window) {
            const titleObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('words-in');
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });

            titles.forEach(title => titleObserver.observe(title));
        } else {
            titles.forEach(title => title.classList.add('words-in'));
        }
    }

    /* ----------------------------------------------------------------------
       Efectos que solo tienen sentido con ratón
       ---------------------------------------------------------------------- */
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (finePointer && !reduceMotion) {

        /* ------------------------------------------------------------------
           12. Parallax del hero: cada capa se mueve a distinta velocidad
           ------------------------------------------------------------------ */
        const hero = $('#inicio');
        const portrait = $('.portrait');
        const decor = $('.bg-decor');
        const chips = $$('.float-chip');

        if (hero && (portrait || decor)) {
            let pending = false;
            let nx = 0;
            let ny = 0;

            const renderParallax = () => {
                pending = false;

                /* Todas las capas se desplazan hacia el mismo lado; cuanto más
                   cerca del espectador, más recorrido. Los chips van dentro
                   del retrato, así que su movimiento se suma al de este. */
                if (decor) decor.style.transform = `translate3d(${nx * -5}px, ${ny * -5}px, 0)`;
                if (portrait) portrait.style.transform = `translate3d(${nx * -14}px, ${ny * -14}px, 0)`;

                chips.forEach((chip, i) => {
                    const f = 10 + i * 4;
                    chip.style.setProperty('--px', `${nx * -f}px`);
                    chip.style.setProperty('--py', `${ny * -f}px`);
                });
            };

            hero.addEventListener('pointermove', (e) => {
                const rect = hero.getBoundingClientRect();
                nx = (e.clientX - rect.left) / rect.width - .5;
                ny = (e.clientY - rect.top) / rect.height - .5;

                if (!pending) {
                    pending = true;
                    requestAnimationFrame(renderParallax);
                }
            });

            hero.addEventListener('pointerleave', () => {
                nx = 0;
                ny = 0;
                renderParallax();
            });
        }

        /* ------------------------------------------------------------------
           13. Inclinación 3D de las tarjetas de proyecto
           ------------------------------------------------------------------ */
        const MAX_TILT = 6;

        $$('.project').forEach(card => {
            let raf = null;

            card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));

            card.addEventListener('pointermove', (e) => {
                if (raf) return;

                raf = requestAnimationFrame(() => {
                    raf = null;
                    const rect = card.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width - .5;
                    const py = (e.clientY - rect.top) / rect.height - .5;

                    /* El -8px replica el desplazamiento del :hover, que el
                       transform en línea anularía. */
                    card.style.transform =
                        `perspective(900px) rotateX(${(-py * MAX_TILT).toFixed(2)}deg) ` +
                        `rotateY(${(px * MAX_TILT).toFixed(2)}deg) translateY(-8px)`;
                });
            });

            card.addEventListener('pointerleave', () => {
                if (raf) {
                    cancelAnimationFrame(raf);
                    raf = null;
                }
                card.classList.remove('is-tilting');
                card.style.transform = '';
            });
        });

        /* ------------------------------------------------------------------
           14. Botones magnéticos
           ------------------------------------------------------------------ */
        $$('[data-magnetic]').forEach(btn => {
            let raf = null;

            btn.addEventListener('pointermove', (e) => {
                if (raf) return;

                raf = requestAnimationFrame(() => {
                    raf = null;
                    const rect = btn.getBoundingClientRect();
                    const x = (e.clientX - rect.left - rect.width / 2) * .25;
                    const y = (e.clientY - rect.top - rect.height / 2) * .32;
                    btn.style.transform = `translate(${x.toFixed(1)}px, ${(y - 2).toFixed(1)}px)`;
                });
            });

            btn.addEventListener('pointerleave', () => {
                if (raf) {
                    cancelAnimationFrame(raf);
                    raf = null;
                }
                btn.style.transform = '';
            });
        });
    }

})();
