export default function initSpotlightSection() {

  // console.warn("Ran spotlight init");

  /**
 * KAITONOTE SPOTLIGHT ANIMATION
 * Isolated for Webflow rebuild (with bug fixes)
 *
 * Dependencies:
 * - GSAP (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js)
 * - ScrollTrigger (https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js)
 *
 * Bug Fixes Applied:
 * - Bounded imageProgress to prevent extreme extrapolation (was causing 800%+ scale)
 * - Bounded coverProgress to prevent z-value overshoot
 * - Added mobile breakpoint check (matches CSS <= 991px)
 * - Added null checks for header elements
 * - Added ScrollTrigger.refresh() for scroll position sync
 * - Fixed pin spacer cleanup with kill(true)
 * - FIXED: Page refresh mid-section now immediately syncs to correct state (no scrub delay)
 */


  // DEBUG: Enable console logging
  const DEBUG = !true;
  const log = function (...args) {
    if (DEBUG) console.log('[KAITONOTE]', ...args);
  };
  const warn = function (...args) {
    if (DEBUG) console.warn('[KAITONOTE]', ...args);
  };
  const error = function (...args) {
    if (DEBUG) console.error('[KAITONOTE]', ...args);
  };

  log('Script starting...');
  log('GSAP available:', typeof gsap !== 'undefined');
  log('ScrollTrigger available:', typeof ScrollTrigger !== 'undefined');

  // Wait for GSAP and ScrollTrigger to be available
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    error('GSAP or ScrollTrigger not loaded!');
    error('gsap:', typeof gsap, '| ScrollTrigger:', typeof ScrollTrigger);
    return;
  }

  log('GSAP version:', gsap.version);
  log('ScrollTrigger version:', ScrollTrigger.version);

  function initKaitonoteGallery() {
    log('initKaitonoteGallery() called');

    const spotlightSection = document.querySelector('.kaitonote-spotlight');
    log('spotlightSection found:', !!spotlightSection);
    if (!spotlightSection) {
      warn('No .kaitonote-spotlight section found - exiting');
      return;
    }

    log('Window width:', window.innerWidth);
    // Don't create ScrollTrigger on mobile where section is hidden (matches CSS breakpoint)
    if (window.innerWidth <= 991) {
      warn('Mobile detected (<=991px) - skipping ScrollTrigger creation');
      return;
    }

    const images = document.querySelectorAll('.kaitonote-spotlight .img');
    const coverImg = document.querySelector('.kaitonote-spotlight .spotlight-cover-img');
    const introHeader = document.querySelector('[data-spotlight-intro-header]');
    const outroHeader = document.querySelector('[data-spotlight-outro-header]');
    const video = document.querySelector('[data-spotlight-video]');
    const videoOverlay = document.querySelector('.spotlight-video-overlay');


    log('Elements found:');
    log('  - images:', images.length);
    log('  - coverImg:', !!coverImg);
    log('  - introHeader:', !!introHeader);
    log('  - outroHeader:', !!outroHeader);
    log('  - videoOverlay:', !!videoOverlay);

    if (!images.length || !coverImg) {
      error('Missing required elements! images:', images.length, 'coverImg:', !!coverImg);
      return;
    }

    // DEBUG: Log element CSS states
    log('--- ELEMENT CSS STATES ---');
    const sectionStyle = window.getComputedStyle(spotlightSection);
    log('Section styles:');
    log('  - display:', sectionStyle.display);
    log('  - visibility:', sectionStyle.visibility);
    log('  - opacity:', sectionStyle.opacity);
    log('  - position:', sectionStyle.position);
    log('  - height:', sectionStyle.height);
    log('  - overflow:', sectionStyle.overflow);
    log('  - perspective:', sectionStyle.perspective);
    log('  - transform:', sectionStyle.transform);

    const coverStyle = window.getComputedStyle(coverImg);
    log('CoverImg styles:');
    log('  - display:', coverStyle.display);
    log('  - visibility:', coverStyle.visibility);
    log('  - opacity:', coverStyle.opacity);
    log('  - transform:', coverStyle.transform);
    log('  - position:', coverStyle.position);

    if (images.length > 0) {
      const firstImgStyle = window.getComputedStyle(images[0]);
      log('First image styles:');
      log('  - display:', firstImgStyle.display);
      log('  - visibility:', firstImgStyle.visibility);
      log('  - opacity:', firstImgStyle.opacity);
      log('  - transform:', firstImgStyle.transform);
      log('  - position:', firstImgStyle.position);
    }
    log('--- END CSS STATES ---');

    const isMobile = window.innerWidth < 1000;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const scatterMultiplier = isMobile ? 2.5 : 0.5;

    // Scatter directions for each of the 20 images
    const scatterDirections = [
      { x: 1.3, y: 0.7 },
      { x: -1.5, y: 1.0 },
      { x: 1.1, y: -1.3 },
      { x: -1.7, y: -0.8 },
      { x: 0.8, y: 1.5 },
      { x: -1.0, y: -1.4 },
      { x: 1.6, y: 0.3 },
      { x: -0.7, y: 1.7 },
      { x: 1.2, y: -1.6 },
      { x: -1.4, y: 0.9 },
      { x: 1.8, y: -0.5 },
      { x: -1.1, y: -1.8 },
      { x: 0.9, y: 1.8 },
      { x: -1.9, y: 0.4 },
      { x: 1.0, y: -1.9 },
      { x: -0.8, y: 1.9 },
      { x: 1.7, y: -1.0 },
      { x: -1.3, y: -1.2 },
      { x: 0.7, y: 2.0 },
      { x: 1.25, y: -0.2 },
    ];

    const startPositions = Array.from(images).map(() => ({
      x: 0,
      y: 0,
      z: -1000,
      scale: 0,
    }));

    const endPositions = scatterDirections.map((dir) => ({
      x: dir.x * screenWidth * scatterMultiplier,
      y: dir.y * screenHeight * scatterMultiplier,
      z: 2000,
      scale: 1,
    }));

    /**
     * EXTRACTED UPDATE FUNCTION
     * Called both by ScrollTrigger.onUpdate AND immediately on init
     * This prevents the scrub delay causing visual glitches on page refresh
     */
    let lastLoggedProgress = -1;
    function updateAnimationState(progress) {
      const scaleMultiplier = isMobile ? 4 : 2;

      // Log detailed transform info at key progress points (0, 0.25, 0.5, 0.75, 1)
      const shouldLogDetails = Math.abs(progress - lastLoggedProgress) > 0.1 ||
        progress === 0 || progress === 1;

      if (shouldLogDetails) {
        lastLoggedProgress = progress;
        log('--- TRANSFORM UPDATE @ progress:', progress.toFixed(3), '---');
      }

      // Animate each image based on progress
      images.forEach((img, index) => {
        const staggerDelay = index * 0.03;

        // FIXED: Bounded to prevent extrapolation beyond end values
        let imageProgress = Math.min(1, Math.max(0, (progress - staggerDelay) * 4));

        const start = startPositions[index];
        const end = endPositions[index];

        const zValue = gsap.utils.interpolate(start.z, end.z, imageProgress);
        // FIXED: Cap scale at intended maximum
        const scaleValue = Math.min(end.scale, gsap.utils.interpolate(start.scale, end.scale, imageProgress * scaleMultiplier));
        const xValue = gsap.utils.interpolate(start.x, end.x, imageProgress);
        const yValue = gsap.utils.interpolate(start.y, end.y, imageProgress);

        // Log first image transforms at key points
        if (shouldLogDetails && index === 0) {
          log('Image[0] transforms:');
          log('  - imageProgress:', imageProgress.toFixed(3));
          log('  - z:', zValue.toFixed(1));
          log('  - scale:', scaleValue.toFixed(3));
          log('  - x:', xValue.toFixed(1));
          log('  - y:', yValue.toFixed(1));
        }

        gsap.set(img, {
          z: zValue,
          scale: scaleValue,
          x: xValue,
          y: yValue,
        });
      });

      // FIXED: Bounded to prevent z-value overshoot
      const coverProgress = Math.min(1, Math.max(0, (progress - 0.7) * 4));
      const coverZValue = -1000 + 1000 * coverProgress;
      const coverScaleValue = Math.min(1, coverProgress * 2);

      if (shouldLogDetails) {
        log('Cover transforms:');
        log('  - coverProgress:', coverProgress.toFixed(3));
        log('  - z:', coverZValue.toFixed(1));
        log('  - scale:', coverScaleValue.toFixed(3));
      }

      gsap.set(coverImg, {
        z: coverZValue,
        scale: coverScaleValue,
        x: 0,
        y: 0,
      });

      // Intro header fade out OG
      // if (introHeader) {
      //   if (progress >= 0.6 && progress <= 0.75) {
      //     const introFadeProgress = (progress - 0.6) / 0.15;
      //     gsap.set(introHeader, { opacity: 1 - introFadeProgress });
      //   } else if (progress < 0.6) {
      //     gsap.set(introHeader, { opacity: 1 });
      //   } else if (progress > 0.75) {
      //     gsap.set(introHeader, { opacity: 0 });
      //   }
      // }
      
      // Intro header animation
      const intro = {
        fadeInStart: 0,
        fadeInEnd: 0.08,
        holdStart: 0.08,
        holdEnd: 0.6,
        fadeOutStart: 0.67,
        fadeOutEnd: 0.75,
      }
      if (introHeader) {

        // FADE IN
        if (progress >= intro.fadeInStart && progress <= intro.fadeInEnd) {
          let t = progress / intro.fadeInEnd
          t = gsap.utils.clamp(0, 1, t)

          const eased = gsap.parseEase('power3.out')(t)

          gsap.set(introHeader, {
            opacity: eased,
            yPercent: 50 * (1 - eased),
            z: 0,
            rotateX: 0,
            filter: `blur(${14 * (1 - eased)}px)`,
          })
        }

        // HOLD
        else if (progress > intro.holdStart && progress < intro.holdEnd) {
          gsap.set(introHeader, {
            opacity: 1,
            yPercent: 0,
            z: 0,
            rotateX: 0,
            filter: 'blur(0px)',
          })
        }

        // FADE OUT
        else if (progress >= intro.fadeOutStart && progress <= intro.fadeOutEnd) {
          let t = (progress - intro.fadeOutStart) / (intro.fadeOutEnd - intro.fadeOutStart)
          t = gsap.utils.clamp(0, 1, t)

          const eased = gsap.parseEase('power3.in')(t)

          gsap.set(introHeader, {
            opacity: 1 - eased,
            yPercent: -50 * eased,
            z: -300 * eased,
            rotateX: -12 * eased,
            filter: `blur(${14 * eased}px)`,
          })
        }

        // AFTER
        else if (progress > intro.fadeOutEnd) {
          gsap.set(introHeader, {
            opacity: 0,
            yPercent: -50,
            z: -300,
            rotateX: -12,
            filter: 'blur(14px)',
          })
        }
      }

      // console.log(progress);

      const videoScaleConfig = {
        start: 0.825,
        end: 0.98,
        scaleStart: 1,
        scaleEnd: 1.4,
      }
      let videoScale = Math.max(1, gsap.utils.mapRange(videoScaleConfig.start, videoScaleConfig.end, videoScaleConfig.scaleStart, videoScaleConfig.scaleEnd, progress));

      if (coverScaleValue == 1){
        if (video) gsap.set(video, {scale: videoScale});
      }

      // Outro header fade in and video overlay darkening
      // if (progress >= 0.90 && progress <= 0.98) {
      //   const outroRevealProgress = (progress - 0.90) / 0.08;
      //   if (outroHeader) gsap.set(outroHeader, { opacity: outroRevealProgress });
      //   if (videoOverlay) gsap.set(videoOverlay, { opacity: outroRevealProgress });
      // } else if (progress < 0.90) {
      //   if (outroHeader) gsap.set(outroHeader, { opacity: 0 });
      //   if (videoOverlay) gsap.set(videoOverlay, { opacity: 0 });
      // } else if (progress > 0.98) {
      //   if (outroHeader) gsap.set(outroHeader, { opacity: 1 });
      //   if (videoOverlay) gsap.set(videoOverlay, { opacity: 1 });
      // }

      const outro = {
        fadeInStart: 0.90,
        fadeInEnd: 0.98,
      }

      if (progress >= outro.fadeInStart && progress <= outro.fadeInEnd) {
        const outroRevealProgress = (progress - outro.fadeInStart) / (outro.fadeInEnd - outro.fadeInStart);
        if (outroHeader) {
          let t = (progress - outro.fadeInStart) / (outro.fadeInEnd - outro.fadeInStart)
          t = gsap.utils.clamp(0, 1, t)

          const eased = gsap.parseEase('power3.out')(t)

          gsap.set(outroHeader, {
            opacity: eased,
            yPercent: 50 * (1 - eased),
            z: 0,
            rotateX: 0,
            filter: `blur(${14 * (1 - eased)}px)`,
          })
        }
        if (videoOverlay) gsap.set(videoOverlay, { opacity: outroRevealProgress });
      } else if (progress < outro.fadeInStart) {
        if (outroHeader) {
          gsap.set(outroHeader, {
            opacity: 0,
            yPercent: 50,
            filter: 'blur(14px)',
          })
        }
        if (videoOverlay) gsap.set(videoOverlay, { opacity: 0 });
      } else if (progress > outro.fadeInEnd) {
        if (outroHeader) {
          gsap.set(outroHeader, {
            opacity: 1,
            yPercent: 0,
            filter: 'blur(0px)',
          })
        }
        if (videoOverlay) gsap.set(videoOverlay, { opacity: 1 });
      }

      // Log actual computed transform after GSAP applies it
      if (shouldLogDetails && images.length > 0) {
        const actualTransform = window.getComputedStyle(images[0]).transform;
        const actualCoverTransform = window.getComputedStyle(coverImg).transform;
        log('After gsap.set():');
        log('  - Image[0] actual transform:', actualTransform);
        log('  - Cover actual transform:', actualCoverTransform);

        // Check if element is in viewport
        const imgRect = images[0].getBoundingClientRect();
        const coverRect = coverImg.getBoundingClientRect();
        log('Bounding rects:');
        log('  - Image[0]:', 'top:', imgRect.top.toFixed(0), 'left:', imgRect.left.toFixed(0), 'width:', imgRect.width.toFixed(0), 'height:', imgRect.height.toFixed(0));
        log('  - Cover:', 'top:', coverRect.top.toFixed(0), 'left:', coverRect.left.toFixed(0), 'width:', coverRect.width.toFixed(0), 'height:', coverRect.height.toFixed(0));
        log('--- END TRANSFORM UPDATE ---');
      }
    }

    // Calculate animation length for progress calculation
    const animationLength = window.innerHeight * 8;
    log('Animation length:', animationLength, 'px');
    log('Creating ScrollTrigger...');

    // Create ScrollTrigger animation
    let updateCount = 0;
    const st = ScrollTrigger.create({
      trigger: '.kaitonote-spotlight',
      // start: 'top top',
      start: 'top 20%',
      // end: '+=' + animationLength + 'px',
      end: '+=' + (animationLength * 1.2) + 'px',
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: function (self) {
        updateCount++;
        // Log every 10th update to avoid console spam
        if (updateCount % 10 === 1) {
          log('onUpdate - progress:', self.progress.toFixed(3), 'direction:', self.direction);
        }
        updateAnimationState(self.progress);
      },
      onRefresh: function (self) {
        log('onRefresh called - progress:', self.progress.toFixed(3));
        // FIXED: On refresh (including page load), immediately sync to correct state
        // This bypasses the scrub delay that was causing visual glitches
        updateAnimationState(self.progress);
      },
      onEnter: function () {
        log('onEnter - ScrollTrigger entered');
      },
      onLeave: function () {
        log('onLeave - ScrollTrigger left');
      },
      onEnterBack: function () {
        log('onEnterBack - ScrollTrigger entered from bottom');
      },
      onLeaveBack: function () {
        log('onLeaveBack - ScrollTrigger left from top');
      },
    });

    log('ScrollTrigger created successfully!');
    log('ScrollTrigger start:', st.start);
    log('ScrollTrigger end:', st.end);
    log('Initial progress:', st.progress);

    /**
     * CRITICAL FIX: Immediate state sync on page load
     * When page refreshes mid-section, the browser restores scroll position
     * AFTER our JS runs. We need to:
     * 1. Wait a frame for scroll position to be restored
     * 2. Calculate the correct progress
     * 3. Immediately apply the correct state (bypassing scrub delay)
     */
    requestAnimationFrame(function () {
      log('requestAnimationFrame - syncing initial state');
      log('Current scroll position:', window.scrollY);
      // Force ScrollTrigger to recalculate based on current scroll
      ScrollTrigger.refresh();
      log('After refresh - progress:', st.progress.toFixed(3));
      // Immediately apply correct state (st.progress is now accurate)
      updateAnimationState(st.progress);
      log('Initial state applied');
    });
  }

  // Initialize on DOM ready
  log('Document readyState:', document.readyState);
  if (document.readyState === 'loading') {
    log('Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function () {
      log('DOMContentLoaded fired');
      initKaitonoteGallery();
      ScrollTrigger.refresh(); // Sync to current scroll position on load
    });
  } else {
    log('DOM already ready - initializing immediately');
    initKaitonoteGallery();
    ScrollTrigger.refresh(); // Sync to current scroll position on load
  }

  // Reinitialize on resize
  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      log('Resize detected - reinitializing');
      ScrollTrigger.getAll().forEach(function (st) {
        if (st.vars.trigger === '.kaitonote-spotlight') {
          log('Killing existing ScrollTrigger');
          st.kill(true); // true = revert pinned element styles
        }
      });
      initKaitonoteGallery();
      ScrollTrigger.refresh(); // Sync to current scroll position
    }, 250);
  });

  log('Script setup complete');

}
