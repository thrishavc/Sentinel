/**
 * ==========================================================================
 * SENTINEL — ANIME.JS POLISHED MOTION SYSTEM (frontend/animations.js)
 * Target: Karnataka State Police Datathon 2026
 * Description: Polished micro-interactions, page entrances, state transitions,
 *              stat number count-ups, accordion smooth expand, and button feedback.
 * ==========================================================================
 */

(function () {
    'use strict';

    // Check if user prefers reduced motion (OS Accessibility Setting)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Safe wrapper around anime.js execution
     */
    function safeAnime(params) {
        if (typeof anime === 'undefined' || prefersReducedMotion) {
            if (params && typeof params.complete === 'function') {
                params.complete();
            }
            return null;
        }
        return anime(params);
    }

    // ==========================================================================
    // 1. PAGE LOAD ENTRANCE (STATE 1 + SIDEBAR)
    // ==========================================================================
    function animatePageEntrance() {
        if (prefersReducedMotion || typeof anime === 'undefined') return;

        // State 1 Main Welcome Entrance
        const state1Elements = [
            '.welcome-badge',
            '.welcome-title',
            '.welcome-subtitle',
            '.input-bar-wrapper',
            '.chips-label',
            '.chips-wrapper'
        ];

        safeAnime({
            targets: state1Elements,
            translateY: [24, 0],
            opacity: [0, 1],
            delay: anime.stagger(80, { start: 100 }),
            duration: 700,
            easing: 'easeOutExpo'
        });

        // Sidebar History Items Stagger Entrance
        animateSidebarHistory();
    }

    // ==========================================================================
    // 5. SIDEBAR HISTORY ITEMS STAGGER ENTRANCE
    // ==========================================================================
    function animateSidebarHistory() {
        if (prefersReducedMotion || typeof anime === 'undefined') return;

        const historyItems = document.querySelectorAll('.history-item');
        if (!historyItems.length) return;

        safeAnime({
            targets: historyItems,
            translateX: [-16, 0],
            opacity: [0, 1],
            delay: anime.stagger(50, { start: 250 }),
            duration: 650,
            easing: 'easeOutExpo'
        });
    }

    // ==========================================================================
    // 2. STATE 1 -> STATE 2 TRANSITION ANIMATION
    // ==========================================================================
    function animateState2Entrance() {
        if (prefersReducedMotion || typeof anime === 'undefined') return;

        // 1. Entity Header Banner Slide Down
        safeAnime({
            targets: '.entity-header-banner',
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutExpo'
        });

        // 2. Direct Answer Card Slide Up
        safeAnime({
            targets: '.direct-answer-card',
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 650,
            delay: 90,
            easing: 'easeOutExpo'
        });

        // 3. 5 Preview Cards Stagger Fade + Scale Up (0.95 -> 1)
        safeAnime({
            targets: '.preview-card',
            scale: [0.95, 1],
            translateY: [16, 0],
            opacity: [0, 1],
            delay: anime.stagger(60, { start: 160 }),
            duration: 700,
            easing: 'easeOutExpo'
        });

        // Trigger stat numbers count-up animation
        animateStatNumbers();
    }

    // ==========================================================================
    // 3. STAT NUMBER COUNT-UP (INNERHTML ROUND-NUMBER TECHNIQUE)
    // ==========================================================================
    function animateStatNumbers() {
        const statEls = document.querySelectorAll('.preview-card .stat-number');
        if (!statEls.length) return;

        statEls.forEach(el => {
            const text = el.textContent || el.innerText;
            const slashMatch = text.match(/^(\d+)\s*\/\s*(\d+)$/);

            if (slashMatch) {
                const targetNum = parseInt(slashMatch[1], 10);
                const totalNum = parseInt(slashMatch[2], 10);

                if (prefersReducedMotion || typeof anime === 'undefined') {
                    el.innerHTML = `${targetNum} <small>/ ${totalNum}</small>`;
                    return;
                }

                const counterObj = { val: 0 };
                safeAnime({
                    targets: counterObj,
                    val: targetNum,
                    round: 1,
                    duration: 1200,
                    easing: 'easeOutCubic',
                    update: function () {
                        el.innerHTML = `${counterObj.val} <small>/ ${totalNum}</small>`;
                    }
                });
            } else {
                const numMatch = text.match(/^(\d+)/);
                if (numMatch) {
                    const targetNum = parseInt(numMatch[1], 10);

                    if (prefersReducedMotion || typeof anime === 'undefined') {
                        el.textContent = targetNum;
                        return;
                    }

                    const counterObj = { val: 0 };
                    safeAnime({
                        targets: counterObj,
                        val: targetNum,
                        round: 1,
                        duration: 1200,
                        easing: 'easeOutCubic',
                        update: function () {
                            el.textContent = counterObj.val;
                        }
                    });
                }
            }
        });
    }

    // ==========================================================================
    // 4. PREVIEW CARD HOVER / FOCUS MICRO-INTERACTION
    // ==========================================================================
    function initCardHoverAnimations() {
        const cards = document.querySelectorAll('.preview-card');
        cards.forEach(card => {
            let activeAnim = null;

            card.addEventListener('mouseenter', () => {
                if (prefersReducedMotion || typeof anime === 'undefined') return;
                if (activeAnim) activeAnim.pause();
                activeAnim = safeAnime({
                    targets: card,
                    translateY: -4,
                    scale: 1.015,
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            });

            card.addEventListener('mouseleave', () => {
                if (prefersReducedMotion || typeof anime === 'undefined') return;
                if (activeAnim) activeAnim.pause();
                activeAnim = safeAnime({
                    targets: card,
                    translateY: 0,
                    scale: 1,
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            });
        });
    }

    // ==========================================================================
    // 6. ACCORDION EXPAND ("SHOW REASONING AND SOURCES") SMOOTH EXPAND
    // ==========================================================================
    function initAccordionAnimation() {
        const details = document.getElementById('reasoning-details');
        if (!details) return;

        const summary = details.querySelector('.reasoning-summary');
        const content = details.querySelector('.reasoning-content');
        const icon = details.querySelector('.accordion-icon');

        if (!summary || !content) return;

        let isAnimating = false;

        summary.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAnimating) return;

            const isOpen = details.hasAttribute('open');

            if (prefersReducedMotion || typeof anime === 'undefined') {
                if (isOpen) {
                    details.removeAttribute('open');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    details.setAttribute('open', '');
                    if (icon) icon.style.transform = 'rotate(90deg)';
                }
                return;
            }

            if (!isOpen) {
                // OPENING
                details.setAttribute('open', '');
                content.style.overflow = 'hidden';
                content.style.height = '0px';
                content.style.opacity = '0';
                isAnimating = true;

                // Chevron rotation
                if (icon) {
                    safeAnime({
                        targets: icon,
                        rotate: 90,
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                }

                const targetHeight = content.scrollHeight;

                safeAnime({
                    targets: content,
                    height: [0, targetHeight],
                    opacity: [0, 1],
                    duration: 380,
                    easing: 'easeOutCubic',
                    complete: function () {
                        content.style.height = 'auto';
                        content.style.overflow = 'visible';
                        isAnimating = false;
                    }
                });
            } else {
                // CLOSING
                content.style.overflow = 'hidden';
                const currentHeight = content.scrollHeight;
                content.style.height = currentHeight + 'px';
                isAnimating = true;

                if (icon) {
                    safeAnime({
                        targets: icon,
                        rotate: 0,
                        duration: 300,
                        easing: 'easeOutQuad'
                    });
                }

                safeAnime({
                    targets: content,
                    height: [currentHeight, 0],
                    opacity: [1, 0],
                    duration: 320,
                    easing: 'easeInCubic',
                    complete: function () {
                        details.removeAttribute('open');
                        content.style.height = 'auto';
                        content.style.overflow = 'visible';
                        isAnimating = false;
                    }
                });
            }
        });
    }

    // ==========================================================================
    // 7. LOADING OVERLAY PULSE / BREATHING ANIMATION
    // ==========================================================================
    let loadingPulseAnim = null;

    function startLoadingPulse() {
        if (prefersReducedMotion || typeof anime === 'undefined') return;

        const overlay = document.getElementById('query-loading-overlay');
        if (!overlay) return;

        const spinner = overlay.querySelector('.loading-spinner');
        const textGroup = overlay.querySelector('.loading-text');

        if (loadingPulseAnim) loadingPulseAnim.pause();

        loadingPulseAnim = safeAnime({
            targets: [spinner, textGroup],
            scale: [0.96, 1.04],
            opacity: [0.85, 1],
            duration: 750,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    function stopLoadingPulse() {
        if (loadingPulseAnim) {
            loadingPulseAnim.pause();
            loadingPulseAnim = null;
        }
    }

    // ==========================================================================
    // 8. SEND BUTTON TACTILE PULSE ANIMATION
    // ==========================================================================
    function animateSendButton(btnElement) {
        if (!btnElement || prefersReducedMotion || typeof anime === 'undefined') return;

        safeAnime({
            targets: btnElement,
            scale: [1, 0.88, 1.1, 1],
            duration: 320,
            easing: 'easeOutQuad'
        });
    }

    // Attach submit listeners to forms for send button feedback
    function initSendButtonFeedback() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', () => {
                const submitBtn = form.querySelector('.send-btn, button[type="submit"]');
                if (submitBtn) {
                    animateSendButton(submitBtn);
                }
            });
        });
    }

    // ==========================================================================
    // INITIALIZATION ON DOM READY
    // ==========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        animatePageEntrance();
        initCardHoverAnimations();
        initAccordionAnimation();
        initSendButtonFeedback();
    });

    // EXPOSE GLOBAL ANIMATION API FOR SCRIPT.JS
    window.SentinelAnimations = {
        animatePageEntrance,
        animateState2Entrance,
        animateStatNumbers,
        animateSidebarHistory,
        startLoadingPulse,
        stopLoadingPulse,
        animateSendButton,
        initCardHoverAnimations
    };

})();
