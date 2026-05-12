console.log('🎨 Animations.js loaded');
console.log('📍 Script URL:', document.currentScript?.src || 'inline');
console.log('📍 Current page:', window.location.href);

const AUTO_SCROLL_SPEED_PX_PER_SEC = 60; // fixed speed for auto-scroll (25% slower)

// Load GSAP ScrollToPlugin if not already loaded
function loadScrollToPlugin() {
  return new Promise((resolve, reject) => {
    if (typeof gsap !== 'undefined' && gsap.plugins && gsap.plugins.scrollTo) {
      console.log('✅ ScrollToPlugin already loaded');
      resolve();
      return;
    }
    
    console.log('📦 Loading GSAP ScrollToPlugin...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js';
    script.onload = () => {
      if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollToPlugin);
        console.log('✅ ScrollToPlugin loaded and registered');
        resolve();
      } else {
        reject('GSAP not found after loading plugin');
      }
    };
    script.onerror = () => reject('Failed to load ScrollToPlugin');
    document.head.appendChild(script);
  });
}

if (!window.barbaInitialized) {
  window.barbaInitialized = true;

  document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded');
    console.log('🔍 Checking dependencies:', {
      barba: typeof barba !== 'undefined',
      gsap: typeof gsap !== 'undefined'
    });
    
  if (typeof barba === 'undefined' || typeof gsap === 'undefined') {
      console.error('❌ Missing barba or gsap');
      console.error('   Barba:', typeof barba);
      console.error('   GSAP:', typeof gsap);
      return;
    }
    
    // Load ScrollToPlugin
    try {
      await loadScrollToPlugin();
    } catch (error) {
      console.error('❌ Failed to load ScrollToPlugin:', error);
      console.log('⚠️ Falling back to manual scroll (may be less smooth)');
    }

    // Init transition-1 cover system
    initTransition1();

    // Auto-scroll state
    let autoScrollTween = null;
    let userScrollTimeout = null;
    let isUserScrolling = false;
    let isAutoScrolling = false; // Track if GSAP is currently scrolling
    let autoScrollEnabled = true; // Allow user to take control
    let startScrollPosition = 0;
    let targetScrollPosition = 0;
    let lastScrollTime = 0;
    let lastScrollPosition = window.scrollY;

    // Smooth scroll state
    let smoothScrollTween = null;
    let smoothScrollEnabled = false;

    function initSmoothScroll() {
      if (smoothScrollEnabled) return;
      if (!(gsap && gsap.plugins && gsap.plugins.scrollTo)) {
        console.warn('⚠️ Smooth scroll requires ScrollToPlugin');
        return;
      }
      smoothScrollEnabled = true;
      let targetY = window.scrollY;

      const onWheel = (event) => {
        if (!smoothScrollEnabled) return;
        event.preventDefault();
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        targetY = Math.max(0, Math.min(maxScroll, targetY + event.deltaY));
        if (smoothScrollTween) smoothScrollTween.kill();
        smoothScrollTween = gsap.to(window, {
          scrollTo: { y: targetY, autoKill: false },
          duration: 0.6,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      };

      window.addEventListener('wheel', onWheel, { passive: false });
    }

    function pauseAutoScrollTemporarily() {
      if (!autoScrollTween || !isAutoScrolling) return;
      isUserScrolling = true;
      autoScrollTween.pause();
      isAutoScrolling = false;
      console.log('⏸️ Auto-scroll paused (user scrolling)');
    }

    function pauseAutoScroll() {
      if (autoScrollTween && autoScrollTween.isActive()) {
        autoScrollTween.pause();
        isAutoScrolling = false;
        console.log('⏸️ Auto-scroll paused (user scrolling)');
      }
    }

    function resumeAutoScroll() {
      if (autoScrollTween && !autoScrollTween.isActive() && !isUserScrolling) {
        const currentScroll = window.scrollY;
        const remainingDistance = targetScrollPosition - currentScroll;
        const remainingDuration = remainingDistance / AUTO_SCROLL_SPEED_PX_PER_SEC;
        
        if (remainingDistance > 0 && remainingDuration > 0) {
          // Use ScrollToPlugin if available
          if (gsap.plugins && gsap.plugins.scrollTo) {
            isAutoScrolling = true;
            autoScrollTween = gsap.to(window, {
              scrollTo: { y: targetScrollPosition, autoKill: false },
              duration: remainingDuration,
              ease: "none",
              onComplete: () => {
                isAutoScrolling = false;
                console.log('✅ Auto-scroll complete');
              }
            });
          } else {
            // Fallback
            const scrollProxy = { scroll: currentScroll };
            autoScrollTween = gsap.to(scrollProxy, {
              scroll: targetScrollPosition,
              duration: remainingDuration,
              ease: "none",
              onUpdate: () => {
                if (!isUserScrolling) {
                  window.scrollTo(0, scrollProxy.scroll);
                }
              },
              onComplete: () => {
                console.log('✅ Auto-scroll complete');
              }
            });
          }
          console.log('▶️ Auto-scroll resumed');
        }
      }
    }

    function startAutoScroll() {
      if (!autoScrollEnabled) {
        console.log('ℹ️ Auto-scroll disabled - user control active');
        return;
      }
      console.log('🔍 Checking if auto-scroll should start...');
      
      // Trigger only if page contains data-auto-scroll="true"
      const hasAutoScroll = !!document.querySelector('[data-auto-scroll="true"]');
      
      console.log('📍 Auto-scroll detection:', {
        hasAutoScroll,
        pathname: window.location.pathname
      });
      
      if (!hasAutoScroll) {
        console.log('❌ data-auto-scroll not found - skipping auto-scroll');
        return;
      }
      
      // Stop any existing auto-scroll
      if (autoScrollTween) {
        autoScrollTween.kill();
      }
      
      const scrollHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = scrollHeight - windowHeight;
      
      console.log('📏 Scroll check:', {
        scrollHeight,
        windowHeight,
        maxScroll,
        currentScroll: window.scrollY
      });
      
      if (maxScroll <= 0) {
        console.log('❌ Page doesn\'t scroll (maxScroll <= 0)');
    return;
  }

      const distance = Math.max(0, maxScroll - window.scrollY);
      const duration = distance / AUTO_SCROLL_SPEED_PX_PER_SEC;
      console.log('🔄 Starting auto-scroll on homepage');
      console.log(`   Will scroll ${Math.round(distance)}px at ${AUTO_SCROLL_SPEED_PX_PER_SEC}px/s (${duration.toFixed(1)}s)`);
      
      // Store start and target positions
      startScrollPosition = window.scrollY;
      targetScrollPosition = maxScroll;
      
      // Use GSAP ScrollToPlugin for smooth scrolling
      if (gsap.plugins && gsap.plugins.scrollTo) {
        console.log('✨ Using ScrollToPlugin for smooth auto-scroll');
        isAutoScrolling = true;
        autoScrollTween = gsap.to(window, {
          scrollTo: { y: maxScroll, autoKill: false },
          duration,
          ease: "none",
          onStart: () => {
            isAutoScrolling = true;
            console.log('✨ Auto-scroll animation started!');
          },
          onComplete: () => {
            isAutoScrolling = false;
            console.log('✅ Auto-scroll complete');
          }
        });
      } else {
        // Fallback to manual scroll
        const scrollProxy = { scroll: window.scrollY };
        autoScrollTween = gsap.to(scrollProxy, {
          scroll: maxScroll,
          duration,
          ease: "none",
          onUpdate: () => {
            if (!isUserScrolling) {
              window.scrollTo(0, scrollProxy.scroll);
            }
          },
          onStart: () => {
            console.log('✨ Auto-scroll animation started!');
          },
          onComplete: () => {
            console.log('✅ Auto-scroll complete');
          }
        });
      }
    }

    function stopAutoScroll() {
      if (autoScrollTween) {
        autoScrollTween.kill();
        autoScrollTween = null;
        console.log('⏸️ Auto-scroll stopped');
      }
    }

    // Handle user scrolling - pause auto-scroll, then resume
    function handleUserInput() {
      pauseAutoScrollTemporarily();
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
      userScrollTimeout = setTimeout(() => {
        isUserScrolling = false;
        resumeAutoScroll();
      }, 1500);
    }
    
    // Only listen to actual user input events, NOT scroll events (which fire during GSAP scrolling)
    document.addEventListener('wheel', handleUserInput, { passive: true });
    document.addEventListener('touchstart', handleUserInput, { passive: true });
    document.addEventListener('keydown', (e) => {
      // Detect arrow keys, page up/down, spacebar
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) {
        handleUserInput();
      }
    }, { passive: true });

    barba.init({
      sync: true,
      preventRunning: true,
      
      transitions: [{
        name: 'crossfade',
        
        // With sync:true, enter runs while leave runs
        // We only need to fade out the current - next appears underneath
        leave() {
          if (hasTransition1()) {
            return playTransition1In();
          }
        },

        enter(data) {
          stopAutoScroll(); // Stop auto-scroll during transition
          if (hasTransition1()) {
            // No fade when transition-1 is present
            return;
          }
          console.log('🌅 ENTER - fading out current container');
          return gsap.to(data.current.container, { 
            opacity: 0, 
            duration: 0.5,
            ease: "power2.out"
          });
        },
        
        afterEnter(data) {
          // Reset user scrolling state on new page
          isUserScrolling = false;
          if (userScrollTimeout) {
            clearTimeout(userScrollTimeout);
            userScrollTimeout = null;
          }
          // Start auto-scroll if on homepage
          setTimeout(() => {
            startAutoScroll();
          }, 1000); // Small delay after page transition
          
          // Initialize Landing scroll opacity animation
          setTimeout(() => {
            initLandingScrollOpacity();
          }, 500);

          // Initialize Menu toggle
          setTimeout(() => {
            initializeMenuToggle();
          }, 600);

          // Initialize Nav shrink on scroll
          setTimeout(() => {
            initializeNavShrinkOnScroll();
          }, 650);

          // Initialize Marquee
          setTimeout(() => {
            initMarquee();
          }, 680);

          // Initialize Text type animation
          setTimeout(() => {
            initTextType();
          }, 690);

          // Initialize radial overlay
          setTimeout(() => {
            initRadialOverlay();
          }, 695);

          // Initialize GSAP smooth scroll (optional)
          setTimeout(() => {
            initSmoothScroll();
          }, 700);

          // Initialize LIDAR scanners
          setTimeout(() => {
            initLidarScanners();
          }, 700);

          // Initialize Disperse grid
          setTimeout(() => {
            initDisperse();
          }, 720);

          // Transition-1 exit animation after enter
          if (hasTransition1()) {
            playTransition1Out();
          }

          // Close nav/menu after transition settles
          setTimeout(() => {
            if (typeof window.closeMenu === 'function') {
              window.closeMenu();
            }
          }, 900);
        }
      }]
    });

    // Start auto-scroll on initial page load
    setTimeout(() => {
      startAutoScroll();
    }, 2000); // Wait 2 seconds after page load
    
    // Initialize Landing scroll opacity animation
    setTimeout(() => {
      initLandingScrollOpacity();
    }, 1000);

    // Initialize Menu toggle
    setTimeout(() => {
      initializeMenuToggle();
    }, 1100);

    // Initialize Nav shrink on scroll
    setTimeout(() => {
      initializeNavShrinkOnScroll();
    }, 1150);

    // Initialize Marquee
    setTimeout(() => {
      initMarquee();
    }, 1180);

    // Initialize Text type animation
    setTimeout(() => {
      initTextType();
    }, 1190);

    // Initialize radial overlay
    setTimeout(() => {
      initRadialOverlay();
    }, 1195);

    // Initialize GSAP smooth scroll (optional)
    setTimeout(() => {
      initSmoothScroll();
    }, 1200);

    // Initialize LIDAR scanners
    setTimeout(() => {
      initLidarScanners();
    }, 1200);

    // Initialize Disperse grid
    setTimeout(() => {
      initDisperse();
    }, 1220);

    // Transition-1 exit animation on initial load
    if (hasTransition1()) {
      playTransition1Out();
    }

    // Close nav/menu after initial load settles
    setTimeout(() => {
      if (typeof window.closeMenu === 'function') {
        window.closeMenu();
      }
    }, 900);

    console.log('✅ Barba ready');
    
    // Expose test function for debugging
    window.testAutoScroll = startAutoScroll;
  });
}

// Standalone auto-scroll (works without Barba)
let standaloneScrollTween = null;
let standaloneUserScrollTimeout = null;
let standaloneIsUserScrolling = false;
let standaloneIsAutoScrolling = false;
// Standalone pause/resume helpers
function pauseStandaloneAutoScroll() {
  if (!standaloneScrollTween || !standaloneIsAutoScrolling) return;
  standaloneIsUserScrolling = true;
  standaloneScrollTween.pause();
  standaloneIsAutoScrolling = false;
  console.log('⏸️ Standalone auto-scroll paused (user scrolling)');
}

function initStandaloneAutoScroll() {
  console.log('🚀 Initializing standalone auto-scroll...');
  
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded - cannot start auto-scroll');
    return;
  }
  
  const hasAutoScroll = !!document.querySelector('[data-auto-scroll="true"]');
  
  if (!hasAutoScroll) {
    console.log('ℹ️ data-auto-scroll not found - skipping auto-scroll');
    return;
  }
  
  setTimeout(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = scrollHeight - windowHeight;
    
    console.log('📏 Standalone scroll check:', {
      scrollHeight,
      windowHeight,
      maxScroll,
      currentScroll: window.scrollY
    });
    
    if (maxScroll <= 0) {
      console.log('❌ Page doesn\'t scroll');
      return;
    }
    
    console.log('🔄 Starting standalone auto-scroll');
    const startPos = window.scrollY;
    const scrollDistance = Math.max(0, maxScroll - window.scrollY);
    const scrollDuration = scrollDistance / AUTO_SCROLL_SPEED_PX_PER_SEC; // fixed speed
    
    // Use GSAP ScrollToPlugin for smooth scrolling
    if (gsap.plugins && gsap.plugins.scrollTo) {
      console.log('✨ Using ScrollToPlugin for smooth auto-scroll');
      standaloneIsAutoScrolling = true;
      standaloneScrollTween = gsap.to(window, {
        scrollTo: { y: maxScroll, autoKill: false },
        duration: scrollDuration,
        ease: "none",
        onStart: () => {
          standaloneIsAutoScrolling = true;
          console.log('✨ Standalone auto-scroll started!');
          console.log(`   Scrolling ${Math.round(scrollDistance)}px at ${AUTO_SCROLL_SPEED_PX_PER_SEC}px/s (${scrollDuration.toFixed(1)}s)`);
        },
        onComplete: () => {
          standaloneIsAutoScrolling = false;
          console.log('✅ Standalone auto-scroll complete - reached bottom');
        }
      });
    } else {
      // Fallback to manual scroll (less smooth)
      console.log('⚠️ ScrollToPlugin not available, using fallback');
      const scrollProxy = { scroll: window.scrollY };
      standaloneScrollTween = gsap.to(scrollProxy, {
        scroll: maxScroll,
        duration: scrollDuration,
        ease: "none",
        onUpdate: function() {
          if (!standaloneIsUserScrolling) {
            window.scrollTo(0, scrollProxy.scroll);
          }
        },
        onComplete: () => {
          console.log('✅ Standalone auto-scroll complete - reached bottom');
        }
      });
    }
    
    // Handle user scrolling for standalone version - pause then resume
    function handleStandaloneUserInput() {
      pauseStandaloneAutoScroll();
      if (standaloneUserScrollTimeout) {
        clearTimeout(standaloneUserScrollTimeout);
      }
      standaloneUserScrollTimeout = setTimeout(() => {
        standaloneIsUserScrolling = false;
        // resume with consistent speed
        const currentScroll = window.scrollY;
        const remainingDistance = maxScroll - currentScroll;
        if (remainingDistance <= 10) return;
        const totalDistance = maxScroll - startPos;
        const remainingDuration = remainingDistance / AUTO_SCROLL_SPEED_PX_PER_SEC;
        if (gsap.plugins && gsap.plugins.scrollTo) {
          standaloneIsAutoScrolling = true;
          standaloneScrollTween = gsap.to(window, {
            scrollTo: { y: maxScroll, autoKill: false },
            duration: remainingDuration,
            ease: "none",
            onComplete: () => {
              standaloneIsAutoScrolling = false;
              console.log('✅ Standalone auto-scroll complete');
            }
          });
        }
      }, 1500);
    }
    
    // Only add listeners if not already added (avoid duplicates)
    // ONLY listen to actual user input, NOT scroll events
    if (!window.standaloneScrollListenersAdded) {
      document.addEventListener('wheel', handleStandaloneUserInput, { passive: true });
      document.addEventListener('touchstart', handleStandaloneUserInput, { passive: true });
      document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) {
          handleStandaloneUserInput();
        }
      }, { passive: true });
      window.standaloneScrollListenersAdded = true;
    }
  }, 2000);
}

// ================================================================================
// 🎭 LANDING SCROLL TEXT OPACITY ANIMATION
// Targets .u-text inside [data-landing-scroll="true"]
// Opacity is 1 near viewport center, 0 when away from center
// ================================================================================

let landingScrollTweens = [];

function initLandingScrollOpacity() {
  console.log('🎭 Initializing Landing scroll text opacity animation...');
  
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded - cannot animate Landing scroll');
    return;
  }
  
  // Clean up any existing animations
  landingScrollTweens.forEach(tween => {
    if (tween && tween.kill) tween.kill();
  });
  landingScrollTweens = [];
  
  const landingSections = document.querySelectorAll('[data-landing-scroll="true"]');
  
  if (landingSections.length === 0) {
    console.log('ℹ️ No sections with data-landing-scroll="true" found');
    console.log('💡 Add Custom Attribute: data-landing-scroll = true');
    return;
  }
  
  console.log(`✅ Found ${landingSections.length} section(s) with data-landing-scroll="true"`);
  
  const textElements = [];
  landingSections.forEach((section, index) => {
    const texts = Array.from(section.querySelectorAll('.u-text'));
    if (texts.length === 0) {
      console.log(`   ⚠️ Section ${index + 1}: no .u-text found`);
      return;
    }
    console.log(`   ✅ Section ${index + 1}: ${texts.length} .u-text elements`);
    textElements.push(...texts);
  });
  
  if (textElements.length === 0) {
    console.log('ℹ️ No .u-text elements found inside data-landing-scroll sections');
    return;
  }
  
  // Set initial opacity to 0 (hidden away from center)
  gsap.set(textElements, { opacity: 0 });
  
  function updateOpacity() {
    const viewportCenter = window.innerHeight * 0.5;
    const innerDistance = window.innerHeight * 0.01; // very tight full-opacity zone
    const outerDistance = window.innerHeight * 0.04; // keep dropoff range
    
    textElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height * 0.5;
      const distance = Math.abs(elCenter - viewportCenter);
      
      // Smooth range-based opacity (no single-word highlight)
      let opacity;
      if (distance <= innerDistance) {
        opacity = 1;
      } else if (distance >= outerDistance) {
        opacity = 0;
      } else {
        const t = (distance - innerDistance) / (outerDistance - innerDistance);
        // Softer curve for approximation feel
        const smooth = t * t * (3 - 2 * t);
        opacity = 1 - smooth;
      }
      
      gsap.to(el, {
        opacity,
        duration: 0.12,
        ease: "power1.out",
        overwrite: true
      });
    });
  }
  
  // Shared scroll listener
  let rafId = null;
  function handleScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateOpacity();
      rafId = null;
    });
  }
  
  // Initial update
  updateOpacity();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });
  
  landingScrollTweens.push({
    kill: () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      gsap.set(textElements, { opacity: 1 });
    }
  });
  
  console.log('✅ Landing scroll text opacity animation initialized');
  
  // Manual test
  window.testLandingScroll = () => {
    console.log('🧪 Testing Landing scroll text animation...');
    gsap.to(textElements, {
      opacity: 0.2,
            duration: 0.6, 
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(textElements, { opacity: 1 })
    });
  };
}

// ================================================================================
// 🧭 MENU TOGGLE (data-menu / data-menu-trigger)
// ================================================================================
function initializeMenuToggle() {
  const menu = document.querySelector('[data-menu]');
  if (!menu) return;

  const originalPaddingTop = menu.dataset.menuPaddingTop || getComputedStyle(menu).paddingTop;
  const originalPaddingBottom = menu.dataset.menuPaddingBottom || getComputedStyle(menu).paddingBottom;
  menu.dataset.menuPaddingTop = originalPaddingTop;
  menu.dataset.menuPaddingBottom = originalPaddingBottom;

  const shouldStartOpen = menu.getAttribute('data-menu-open') === 'true';
  // Default hidden on page enter
  if (!shouldStartOpen) {
    gsap.set(menu, {
      autoAlpha: 0,
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    menu.dataset.menuOpen = 'false';
  } else {
    gsap.set(menu, {
      autoAlpha: 1,
      height: 'auto',
      paddingTop: originalPaddingTop,
      paddingBottom: originalPaddingBottom,
      overflow: 'hidden',
      pointerEvents: 'auto',
    });
    menu.dataset.menuOpen = 'true';
  }

  if (window.menuToggleInitialized) return;
  window.menuToggleInitialized = true;

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-menu-trigger]');
    if (!trigger) return;

    if (window.navShrinkControl) {
      const currentMenu = document.querySelector('[data-menu]');
      if (currentMenu && typeof window.navShrinkControl.getState === 'function') {
        currentMenu.dataset.navRestore = window.navShrinkControl.getState();
        console.log('🧭 [NAV] store restore state:', currentMenu.dataset.navRestore);
      }
      if (typeof window.navShrinkControl.setMenuOpen === 'function') {
        window.navShrinkControl.setMenuOpen(true);
      }
      if (typeof window.navShrinkControl.expand === 'function') {
        window.navShrinkControl.expand();
      }
    }

    const currentMenu = document.querySelector('[data-menu]');
    if (!currentMenu) return;

    const isOpen = currentMenu.dataset.menuOpen === 'true';
    if (isOpen) {
      currentMenu.dataset.menuOpen = 'false';
      gsap.to(currentMenu, {
        autoAlpha: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          currentMenu.style.pointerEvents = 'none';
          if (window.navShrinkControl) {
            if (typeof window.navShrinkControl.setMenuOpen === 'function') {
              window.navShrinkControl.setMenuOpen(false);
            }
            if (typeof window.navShrinkControl.pauseScroll === 'function') {
              window.navShrinkControl.pauseScroll(500);
            }
            const restore = currentMenu.dataset.navRestore;
            console.log('🧭 [NAV] restore state (trigger close):', restore);
            if (restore === 'shrunk' && typeof window.navShrinkControl.shrink === 'function') {
              window.navShrinkControl.shrink();
            } else if (typeof window.navShrinkControl.expand === 'function') {
              window.navShrinkControl.expand();
            }
          }
        },
      });
    } else {
      currentMenu.dataset.menuOpen = 'true';
      currentMenu.style.pointerEvents = 'auto';
      const targetHeight = currentMenu.scrollHeight;
      const menuItemCandidates = Array.from(currentMenu.querySelectorAll('[data-menu-item]'));
      const menuItems = menuItemCandidates.length > 0
        ? menuItemCandidates
        : Array.from(currentMenu.children);
      gsap.to(currentMenu, {
        autoAlpha: 1,
        height: targetHeight,
        paddingTop: originalPaddingTop,
        paddingBottom: originalPaddingBottom,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          currentMenu.style.height = 'auto';
        },
      });
      // Ensure nav expands after menu opens (recompute width)
      if (window.navShrinkControl && typeof window.navShrinkControl.expand === 'function') {
        setTimeout(() => window.navShrinkControl.expand(), 80);
      }
      if (menuItems.length > 0) {
        const tl = gsap.timeline();
        menuItems.forEach((item, index) => {
          tl.fromTo(
            item,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
            0.15 + index * 0.1
          );
        });
      }
    }
  });

  const closeMenu = () => {
    const currentMenu = document.querySelector('[data-menu]');
    if (!currentMenu) return;
    if (currentMenu.dataset.menuOpen !== 'true') return;
    currentMenu.dataset.menuOpen = 'false';
    gsap.to(currentMenu, {
      autoAlpha: 0,
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => {
        currentMenu.style.pointerEvents = 'none';
        if (window.navShrinkControl) {
          if (typeof window.navShrinkControl.setMenuOpen === 'function') {
            window.navShrinkControl.setMenuOpen(false);
          }
          if (typeof window.navShrinkControl.pauseScroll === 'function') {
            window.navShrinkControl.pauseScroll(500);
          }
          const restore = currentMenu.dataset.navRestore;
          console.log('🧭 [NAV] restore state (closeMenu):', restore);
          if (restore === 'shrunk' && typeof window.navShrinkControl.shrink === 'function') {
            window.navShrinkControl.shrink();
          } else if (typeof window.navShrinkControl.expand === 'function') {
            window.navShrinkControl.expand();
          }
        }
      },
    });
  };
  const closeMenuDelayed = (delay = 300) => {
    setTimeout(() => closeMenu(), delay);
  };
  window.closeMenu = closeMenu;

  // Close on scroll
  window.addEventListener('scroll', () => closeMenu(), { passive: true });

  // Close on click outside menu + trigger
  document.addEventListener('click', (event) => {
    const isTrigger = event.target.closest('[data-menu-trigger]');
    const isMenu = event.target.closest('[data-menu]');
    if (!isTrigger && !isMenu) {
      closeMenuDelayed(350);
    }
  });

  // Close on clickable_link
  document.addEventListener('click', (event) => {
    if (event.target.closest('.clickable_link')) {
      closeMenuDelayed(350);
    }
  });
}

// ================================================================================
// 🧭 NAV SHRINK ON SCROLL (data-nav="wrap")
// ================================================================================
function initializeNavShrinkOnScroll() {
  const navWraps = Array.from(document.querySelectorAll('[data-nav]'));
  if (navWraps.length === 0) return;

  const targets = navWraps.map((navWrap) => {
    const display = window.getComputedStyle(navWrap).display;
    const parentDisplay = navWrap.parentElement
      ? window.getComputedStyle(navWrap.parentElement).display
      : '';
    // Allow explicit target for shrinking
    const explicitTarget = navWrap.querySelector('[data-nav-target]');
    // If display: contents or parent is flex, prefer animating inner target
    const fallbackInner = navWrap.firstElementChild;
    const preferInner =
      explicitTarget ||
      display === 'contents' ||
      (parentDisplay && parentDisplay.includes('flex'));
    const target = explicitTarget || (preferInner && fallbackInner) || navWrap;
    if (!target) return null;
    if (target.dataset.navShrinkInitialized === 'true') return null;
    target.dataset.navShrinkInitialized = 'true';
    gsap.set(target, {
      width: '100%',
      maxWidth: '100%'
    });
    // Only apply flex alignment on the flex item itself
    if (target === navWrap) {
      gsap.set(target, {
        flexBasis: '100%',
        marginLeft: 'auto',
        marginRight: 0,
        alignSelf: 'flex-end'
      });
    }
    return { navWrap, target, isInner: target !== navWrap };
  }).filter(Boolean);

  let lastScrollY = window.scrollY;
  let isShrunk = false;
  let ticking = false;
  let accumulatedDelta = 0;
  let lastDir = 0;
  const TRIGGER_DISTANCE = 40;

  const animateShrink = () => {
    isShrunk = true;
    accumulatedDelta = 0;
    targets.forEach(({ target }) => {
      target.dataset.navState = 'shrunk';
    });
  };

  const animateExpand = () => {
    isShrunk = false;
    accumulatedDelta = 0;
    targets.forEach(({ target }) => {
      target.dataset.navState = 'wide';
    });
  };

  window.navShrinkControl = {
    expand: animateExpand,
    shrink: animateShrink,
    setMenuOpen: (open) => {
      window.navShrinkControl._menuOpen = open;
    },
    pauseScroll: (ms = 400) => {
      window.navShrinkControl._ignoreScrollUntil = Date.now() + ms;
    },
    getState: () => (isShrunk ? 'shrunk' : 'wide')
  };

  const update = () => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    lastScrollY = currentY;
    ticking = false;
    if (Math.abs(delta) < 4) return;

    const dir = Math.sign(delta);
    if (dir !== lastDir) {
      accumulatedDelta = 0;
      lastDir = dir;
    }
    accumulatedDelta += delta;

    if (window.navShrinkControl) {
      if (window.navShrinkControl._menuOpen) return;
      if (window.navShrinkControl._ignoreScrollUntil && Date.now() < window.navShrinkControl._ignoreScrollUntil) return;
    }

    if (dir > 0 && !isShrunk && accumulatedDelta > TRIGGER_DISTANCE) {
      animateShrink();
    } else if (dir < 0 && isShrunk && accumulatedDelta < -TRIGGER_DISTANCE) {
      animateExpand();
    }
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
}

// ================================================================================
// 🏁 MARQUEE (data-marquee="track" / data-marquee="content")
// ================================================================================
function initMarquee() {
  const tracks = Array.from(document.querySelectorAll('[data-marquee="track"]'));
  if (tracks.length === 0) return;

  if (typeof gsap === 'undefined') {
    console.warn('⚠️ GSAP not loaded - marquee disabled');
    return;
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getEffectiveWidth = (element) => {
    if (!element) return 0;
    let current = element;
    while (current && current !== document.body) {
      const width = current.getBoundingClientRect().width;
      if (width) return width;
      current = current.parentElement;
    }
    return window.innerWidth || 0;
  };

  tracks.forEach((track) => {
    if (track.dataset.marqueeInitialized === 'true') return;
    const content = track.querySelector('[data-marquee="content"]');
    if (!content) {
      console.warn('⚠️ Marquee track missing content', track);
      return;
    }

    console.log('🧭 Marquee init', {
      track,
      content,
      trackDisplay: window.getComputedStyle(track).display,
      contentDisplay: window.getComputedStyle(content).display
    });

    const computedContentDisplay = window.getComputedStyle(content).display;
    if (computedContentDisplay === 'contents') {
      console.warn('⚠️ Marquee content is display: contents, forcing flex', content);
      content.style.display = 'flex';
      content.style.flexWrap = 'nowrap';
    }

    track.dataset.marqueeInitialized = 'true';
    if (prefersReducedMotion) return;

    const speed = parseFloat(track.dataset.marqueeSpeed) || 80;

    const setupMarquee = () => {
      const viewportWidth = getEffectiveWidth(track);
      const contentWidth = getEffectiveWidth(content);
      if (!viewportWidth || !contentWidth) {
        console.warn('⚠️ Marquee widths invalid', { viewportWidth, contentWidth, track, content });
        return;
      }

      if (track._marqueeTween) {
        track._marqueeTween.kill();
      }

      const totalDistance = viewportWidth + contentWidth;
      const startX = -contentWidth;
      const endX = viewportWidth;
      gsap.set(content, { x: startX });
      console.log('📦 Marquee setup', {
        viewportWidth,
        contentWidth,
        startX,
        endX,
        speed
      });
      const setOpacity = gsap.quickSetter(content, 'opacity');
      const updateOpacity = () => {
        const currentX = gsap.getProperty(content, 'x');
        const contentCenter = currentX + contentWidth / 2;
        const viewportCenter = viewportWidth / 2;
        if (contentCenter <= viewportCenter) {
          setOpacity(1);
          return;
        }
        const fadeDistance = Math.max(120, viewportWidth * 0.25);
        const progress = Math.min(1, (contentCenter - viewportCenter) / fadeDistance);
        setOpacity(Math.max(0, 1 - progress));
      };

      updateOpacity();
      track._marqueeTween = gsap.to(content, {
        x: endX,
        duration: totalDistance / speed,
        ease: 'none',
        repeat: -1,
        onUpdate: updateOpacity
      });
    };

    setupMarquee();

    if (!track._marqueeResizeHandler) {
      track._marqueeResizeHandler = () => {
        if (track._marqueeResizeTimer) {
          clearTimeout(track._marqueeResizeTimer);
        }
        track._marqueeResizeTimer = setTimeout(setupMarquee, 150);
      };
      window.addEventListener('resize', track._marqueeResizeHandler, { passive: true });
    }
  });
}

// ================================================================================
// ✍️ TEXT TYPE ANIMATION (data-text="type")
// ================================================================================
function initTextType() {
  const wrappers = Array.from(document.querySelectorAll('[data-text="type"]'));
  if (wrappers.length === 0) return;

  if (typeof gsap === 'undefined' || typeof TextPlugin === 'undefined') {
    console.warn('⚠️ TextPlugin not loaded - text type animation disabled');
    return;
  }

  gsap.registerPlugin(TextPlugin);

  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.textTypeInitialized === 'true') return;
    const target =
      wrapper.querySelector('h1, h2, h3, h4, h5, h6, [data-text-target]') || wrapper;
    if (!target) return;

    wrapper.dataset.textTypeInitialized = 'true';

    const categoryEl = wrapper.querySelector('[data-text="category"]');
    const valueEl = wrapper.querySelector('[data-text="value"]');

    const pairs = [
      { category: 'Size', value: '2400 mm × 1700 mm' },
      { category: 'Speed', value: '80 km/h' },
      { category: 'Weight', value: '1,600 kg / armored' },
      { category: 'Range', value: '150 km plus' },
      { category: 'Payload', value: '1,200 kg plus' },
      { category: 'Climbing', value: '60 degree plus' },
      { category: 'Drivetrain', value: 'Fully electric / 400 V' },
      { category: 'Terrain', value: 'ATV / swimmable' },
      { category: 'Tracks', value: 'Rubber' },
      { category: 'Suspension', value: 'Full' },
      { category: 'Heat', value: 'Close to 0 signature' },
      { category: 'Acoustics', value: 'Close to 0 signature' }
    ];

    if (!categoryEl || !valueEl) {
      console.warn('⚠️ data-text="type" wrapper missing [data-text="category"] or [data-text="value"] — skipping');
      return;
    }

    const categoryTarget =
      categoryEl.querySelector('h1, h2, h3, h4, h5, h6, [data-text-target]') || categoryEl;
    const valueTarget =
      valueEl.querySelector('h1, h2, h3, h4, h5, h6, [data-text-target]') || valueEl;

    const normalizeText = (text) =>
      String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

    categoryTarget.textContent = '';
    valueTarget.textContent = '';
    gsap.set([categoryEl, valueEl], { opacity: 1 });
    categoryTarget.style.whiteSpace = 'nowrap';
    valueTarget.style.whiteSpace = 'nowrap';

    const ensureMinHeight = (element, measureEl) => {
      if (!element || !measureEl) return;
      const currentMin = parseFloat(element.style.minHeight || '0') || 0;
      const measured = measureEl.getBoundingClientRect().height || 0;
      if (measured > currentMin) {
        element.style.minHeight = `${measured}px`;
      }
    };

    const tl = gsap.timeline({ repeat: -1 });
    tl.to({}, { duration: 0.8 });
    pairs.forEach(({ category, value }) => {
      const cleanCategory = normalizeText(category);
      const cleanValue = normalizeText(value);
      const categoryDuration = Math.max(0.25, cleanCategory.length * 0.02);
      const valueDuration = Math.max(0.25, cleanValue.length * 0.015);
      tl.to(categoryTarget, {
        text: cleanCategory,
        duration: categoryDuration,
        ease: 'steps(12)',
        onComplete: () => ensureMinHeight(categoryEl, categoryTarget)
      })
        .to(valueTarget, {
          text: cleanValue,
          duration: valueDuration,
          ease: 'steps(14)',
          onComplete: () => ensureMinHeight(valueEl, valueTarget)
        }, `-=${Math.min(0.2, categoryDuration * 0.3)}`)
        .to({}, { duration: 1.0 })
        .to([categoryEl, valueEl], { opacity: 0, duration: 0.2, ease: 'none' })
        .to([categoryEl, valueEl], { opacity: 1, duration: 0.01 });
    });
  });
}

// ================================================================================
// 🌑 RADIAL OVERLAY (data-overlay="radial")
// ================================================================================
function initRadialOverlay() {
  const overlay = document.querySelector('[data-overlay="radial"]');
  if (!overlay) return;
  if (overlay.dataset.overlayInitialized === 'true') return;
  overlay.dataset.overlayInitialized = 'true';

  // Architecture trace:
  // Input → output: pointer/timed-sweep updates targetX/Y → tick eases currentX/Y → CSS vars update gradient center.
  // Consumers: CSS radial-gradient uses --overlay-x/--overlay-y; no other functions depend on output.
  // File usage: only animations.js defines/uses initRadialOverlay.
  // Example: sweep sets targetX 15→85, targetY 50; tick updates --overlay-x/--overlay-y each frame.
  // System state: targetX/Y updated by pointer or sweep, currentX/Y eased; idle uses lastMoveTime.

  const cssText =
    'radial-gradient(circle at var(--overlay-x, 50%) var(--overlay-y, 50%), rgba(0,0,0,var(--overlay-center-alpha, 0)) 0%, rgba(0,0,0,var(--overlay-edge-alpha, 0.9)) 35%, rgba(0,0,0,var(--overlay-edge-strong-alpha, 0.95)) 60%)';
  overlay.style.backgroundImage = cssText;

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer =
    window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches);

  let currentX = 50;
  let currentY = 50;
  let targetX = 50;
  let targetY = 50;
  const jitterSeedX = Math.random() * 1000;
  const jitterSeedY = Math.random() * 1000;
  let lastMoveTime = Date.now();
  let idleProgress = 0;

  const setX = typeof gsap !== 'undefined'
    ? gsap.quickSetter(overlay, '--overlay-x', '%')
    : (value) => overlay.style.setProperty('--overlay-x', `${value}%`);
  const setY = typeof gsap !== 'undefined'
    ? gsap.quickSetter(overlay, '--overlay-y', '%')
    : (value) => overlay.style.setProperty('--overlay-y', `${value}%`);
  const setCenterAlpha = typeof gsap !== 'undefined'
    ? gsap.quickSetter(overlay, '--overlay-center-alpha')
    : (value) => overlay.style.setProperty('--overlay-center-alpha', value);
  const setEdgeAlpha = typeof gsap !== 'undefined'
    ? gsap.quickSetter(overlay, '--overlay-edge-alpha')
    : (value) => overlay.style.setProperty('--overlay-edge-alpha', value);
  const setEdgeStrongAlpha = typeof gsap !== 'undefined'
    ? gsap.quickSetter(overlay, '--overlay-edge-strong-alpha')
    : (value) => overlay.style.setProperty('--overlay-edge-strong-alpha', value);

  setX(currentX);
  setY(currentY);
  setCenterAlpha(0);
  setEdgeAlpha(0.9);
  setEdgeStrongAlpha(0.95);

  // Desktop idle sweep state
  let desktopSweepActive = false;
  let desktopSweepStartTime = 0;
  let lastUserInputTime = Date.now();
  const DESKTOP_IDLE_DELAY = 2000; // ms before sweep starts
  const DESKTOP_SWEEP_FORWARD_MS = 3000;
  const DESKTOP_SWEEP_PAUSE_MS = 700;
  const DESKTOP_SWEEP_TOTAL_MS = (DESKTOP_SWEEP_FORWARD_MS * 2) + (DESKTOP_SWEEP_PAUSE_MS * 2);
  // Cap idle darkening so spotlight never fades to full black
  const IDLE_DARKNESS_MAX = 0.42;

  const updateTargetFromEvent = (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    targetX = Math.max(0, Math.min(100, x));
    targetY = Math.max(0, Math.min(100, y));
    lastMoveTime = Date.now();
    lastUserInputTime = Date.now();
    // Pause desktop sweep when user moves pointer
    if (desktopSweepActive) {
      desktopSweepActive = false;
    }
  };

  if (!prefersReducedMotion) {
    if (isCoarsePointer && typeof gsap !== 'undefined') {
      const sweepProxy = { x: 15, y: 50 };
      gsap.timeline({ repeat: -1 })
        .to(sweepProxy, {
          x: 85,
          duration: 3.0,
          ease: 'power1.inOut',
          onUpdate: () => {
            targetX = sweepProxy.x;
            targetY = sweepProxy.y;
            lastMoveTime = Date.now();
          }
        })
        .to({}, { duration: 0.7 })
        .to(sweepProxy, {
          x: 15,
          duration: 3.0,
          ease: 'power1.inOut',
          onUpdate: () => {
            targetX = sweepProxy.x;
            targetY = sweepProxy.y;
            lastMoveTime = Date.now();
          }
        })
        .to({}, { duration: 0.7 });
    }

    const tick = () => {
      const idleMs = Date.now() - lastMoveTime;
      const isIdle = idleMs > 200;

      // Desktop idle sweep: run automatically after 2s without user input
      if (!isCoarsePointer) {
        const userIdleMs = Date.now() - lastUserInputTime;
        if (userIdleMs > DESKTOP_IDLE_DELAY) {
          if (!desktopSweepActive) {
            desktopSweepActive = true;
            desktopSweepStartTime = Date.now();
          }
        } else if (desktopSweepActive) {
          desktopSweepActive = false;
        }

        if (desktopSweepActive) {
          const phase = (Date.now() - desktopSweepStartTime) % DESKTOP_SWEEP_TOTAL_MS;
          if (phase < DESKTOP_SWEEP_FORWARD_MS) {
            // 15 -> 85
            targetX = 15 + (70 * (phase / DESKTOP_SWEEP_FORWARD_MS));
          } else if (phase < DESKTOP_SWEEP_FORWARD_MS + DESKTOP_SWEEP_PAUSE_MS) {
            // hold at right edge
            targetX = 85;
          } else if (phase < (DESKTOP_SWEEP_FORWARD_MS * 2) + DESKTOP_SWEEP_PAUSE_MS) {
            // 85 -> 15
            const backPhase = phase - (DESKTOP_SWEEP_FORWARD_MS + DESKTOP_SWEEP_PAUSE_MS);
            targetX = 85 - (70 * (backPhase / DESKTOP_SWEEP_FORWARD_MS));
          } else {
            // hold at left edge
            targetX = 15;
          }
          targetY = 50;
          // Keep overlay lit while synthetic sweep is active
          lastMoveTime = Date.now();
        }
      }

      if (isIdle && !desktopSweepActive) {
        idleProgress = Math.min(IDLE_DARKNESS_MAX, idleProgress + 0.03);
      } else {
        idleProgress = Math.max(0, idleProgress - 0.12);
      }

      setCenterAlpha(idleProgress);
      setEdgeAlpha(0.9 + 0.1 * idleProgress);
      setEdgeStrongAlpha(0.95 + 0.05 * idleProgress);

      const time = Date.now() / 1000;
      const jitterAmount = 0.6;
      const jitterX =
        (Math.sin(time * 1.7 + jitterSeedX) + Math.sin(time * 0.9 + jitterSeedX * 0.7)) *
        jitterAmount;
      const jitterY =
        (Math.sin(time * 1.3 + jitterSeedY) + Math.sin(time * 0.8 + jitterSeedY * 0.6)) *
        jitterAmount;
      const ease = 0.1 + Math.abs(Math.sin(time * 0.6)) * 0.06;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      setX(currentX + jitterX);
      setY(currentY + jitterY);
    };

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add(tick);
    } else {
      const rafTick = () => {
        tick();
        requestAnimationFrame(rafTick);
      };
      requestAnimationFrame(rafTick);
    }

    window.addEventListener('pointermove', updateTargetFromEvent, { passive: true });
    window.addEventListener('touchmove', (event) => {
      if (!event.touches || !event.touches[0]) return;
      updateTargetFromEvent(event.touches[0]);
    }, { passive: true });
  }
}

// ================================================================================
// 🎬 TRANSITION-1 PAGE COVER
// ================================================================================
function initTransition1() {
  const components = Array.from(document.querySelectorAll('.transition-1_component'));
  if (components.length === 0) return;

  if (!sessionStorage.getItem('transition-1-first-visit')) {
    sessionStorage.setItem('transition-1-first-visit', 'viewed');
    document.documentElement.classList.add('transition-1-first-visit');
    // Remove after first paint so transitions work after initial load
    setTimeout(() => {
      document.documentElement.classList.remove('transition-1-first-visit');
    }, 0);
  }
}

function hasTransition1() {
  return document.querySelector('.transition-1_component');
}

function playTransition1In() {
  const components = Array.from(document.querySelectorAll('.transition-1_component'));
  if (components.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let remaining = components.length;
    components.forEach((component) => {
      gsap.context(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            remaining -= 1;
            if (remaining <= 0) resolve();
          }
        });
        tl.set(component, { display: 'flex' });
        tl.fromTo(
          '.transition-1_column',
          { yPercent: 100 },
          { yPercent: 0, duration: 0.3, ease: 'power1.inOut', stagger: { each: 0.1, from: 'start' } }
        );
      }, component);
    });
  });
}

function playTransition1Out() {
  const components = Array.from(document.querySelectorAll('.transition-1_component'));
  if (components.length === 0) return;
  gsap.context(() => {
    components.forEach((component) => {
      const tl = gsap.timeline();
      tl.set(component, { display: 'flex' });
      tl.to('.transition-1_column', {
        yPercent: -100,
        duration: 0.3,
        ease: 'power1.inOut',
        stagger: { each: 0.1, from: 'start' },
        onComplete: () => {
          component.style.display = 'none';
        }
      });
    });
  });
}

// ================================================================================
// 🛰️ LIDAR LANDSCAPE SCANNER (mount into [data-lidar="true"])
// ================================================================================

let lidarInitialized = false;

function loadThreeJs() {
  return new Promise((resolve, reject) => {
    if (typeof THREE !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      if (typeof THREE !== 'undefined') {
        resolve();
      } else {
        reject('THREE not found after load');
      }
    };
    script.onerror = () => reject('Failed to load THREE.js');
    document.head.appendChild(script);
  });
}

function injectLidarStyles() {
  if (document.getElementById('lidar-scanner-styles')) return;
  const style = document.createElement('style');
  style.id = 'lidar-scanner-styles';
  style.textContent = `
    .lidar-container { position: relative; background: transparent; overflow: hidden; }
    .lidar-canvas { width: 100%; height: 100%; display: block; }
    .lidar-info {
      position: absolute; top: 12px; left: 12px; color: #00ff00;
      font-size: 12px; text-shadow: 0 0 8px #00ff00; pointer-events: none;
      z-index: 10; background: rgba(0,0,0,0.7); padding: 10px;
      border: 1px solid #00ff00; border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .lidar-controls {
      position: absolute; bottom: 12px; left: 12px; color: #00ffff;
      font-size: 11px; background: rgba(0,0,0,0.8); padding: 10px;
      border: 1px solid #00ffff; border-radius: 4px; z-index: 10;
      font-family: 'Courier New', monospace;
    }
    .lidar-controls button {
      background: #00ffff; border: none; color: #000; padding: 6px 10px;
      margin: 4px 2px; cursor: pointer; font-weight: bold; border-radius: 3px;
      font-size: 10px; font-family: 'Courier New', monospace;
    }
    .lidar-controls button:hover { background: #00ff00; }
    .lidar-status { color: #ffff00; }
  `;
  document.head.appendChild(style);
}

async function initLidarScanners() {
  const containers = document.querySelectorAll('[data-lidar="true"]');
  if (containers.length === 0) return;

  injectLidarStyles();
  try {
    await loadThreeJs();
  } catch (err) {
    console.error('❌ LIDAR: failed to load THREE.js', err);
    return;
  }

  containers.forEach((container) => {
    if (container.dataset.lidarInitialized === 'true') {
      return;
    }
    container.dataset.lidarInitialized = 'true';
    container.classList.add('lidar-container');
    container.innerHTML = `
      <div class="lidar-canvas" data-canvas></div>
    `;

    const canvasHost = container.querySelector('[data-canvas]');
    const infoStatus = null;
    const infoPoints = null;
    const infoProgress = null;
    const infoAngle = null;
    const speedLabel = null;

    const zoomSource =
      container.closest('[data-lidar-zoom]') ||
      container.closest('[data-lidar-variant]') ||
      container;
    const zoomAttr = zoomSource.getAttribute('data-lidar-zoom');
    const variantAttr = zoomSource.getAttribute('data-lidar-variant');
    const isZoomed =
      (variantAttr && variantAttr.toLowerCase() === 'zoom') ||
      (zoomAttr !== null && zoomAttr.toLowerCase() !== 'false');
    const isLandscape =
      variantAttr && variantAttr.toLowerCase() === 'landscape';
    const isRings =
      variantAttr && variantAttr.toLowerCase() === 'rings';
    const isMulti =
      variantAttr && variantAttr.toLowerCase() === 'multi';
    // Pixel-based sizes (sizeAttenuation:false) — consistent regardless of canvas size
    const POINT_SIZE = 1;
    const TOP_VIEW_HEIGHT = isZoomed ? 30 : 50;
    const allowDrive = (!isZoomed || isLandscape || isMulti) && !isRings;
    const HEIGHT_SCALE = isLandscape ? 0.35 : 1;
    const NUM_RINGS = 16;
    const MAX_ACCUMULATED_SCANS = 8;
    const RING_ANGLES = [];

    let scene, camera, renderer;
    let terrainPoints = [];
    let scannedPoints;
    let scanAngle = 0;
    let scanning = false;
    let scanSpeed = 0.03; // FAST by default
    let speedMode = 1;
    let totalPoints = 0;
    let visiblePoints = 0;
    let terrainSeedA = Math.random() * 1000;
    let terrainSeedB = Math.random() * 1000;
    let terrainMorph = 0;
    let viewMode = 1; // 1 = top-down default
    let scanBeam;
    const DRIVE_SPEED = 0.03; // world shift per frame (vehicle motion)
    let autoLoop = true;
    let pointAges = [];
    let ringTurns = 0;
    let accumulatedScans = [];
    let vehicleZ = 0;
    let currentScanPoints = [];

    const SCAN_RESOLUTION = 200;
    const VERTICAL_RAYS = 100;
    const MAX_RANGE = 50;

    function setCamera() {
      if (viewMode === 0) {
        camera.position.set(-25, 8, 15);
        camera.lookAt(0, 3, 0);
      } else {
        camera.position.set(0, TOP_VIEW_HEIGHT, 0.1);
        camera.lookAt(0, 0, 0);
      }
    }

    function updateStatus(status) {
      // UI hidden
    }

    function updateUI() {
      const progress = Math.min(100, (scanAngle / (Math.PI * 2)) * 100);
      const degrees = Math.min(360, (scanAngle * 180 / Math.PI));
      // UI hidden
    }

    function getTerrainHeight(x, z, seed) {
      const baseScale = 0.05;
      const baseHeight = (
        Math.sin(x * baseScale + seed * 10) *
        Math.cos(z * baseScale + seed * 10) +
        Math.sin(x * baseScale * 1.7 + seed * 11) *
        Math.cos(z * baseScale * 1.7 + seed * 11) * 0.5
      ) * 3;

      const mediumScale = 0.1;
      const mediumHeight = (
        Math.sin(x * mediumScale + seed * 20) *
        Math.cos(z * mediumScale + seed * 20) +
        Math.sin(x * mediumScale * 1.5 + seed * 21) *
        Math.cos(z * mediumScale * 1.5 + seed * 21) * 0.7
      ) * 1.5;

      const detailScale = 0.3;
      const detailHeight = (
        Math.sin(x * detailScale + seed * 30) *
        Math.cos(z * detailScale + seed * 30) +
        Math.sin(x * detailScale * 2.1 + seed * 31) *
        Math.cos(z * detailScale * 2.1 + seed * 31) * 0.5
      ) * 0.4;

      const ridgeScale = 0.08;
      const ridgePattern = Math.abs(Math.sin(x * ridgeScale + z * ridgeScale * 0.7 + seed * 40));
      const ridgeHeight = Math.pow(ridgePattern, 4) * 2;

      const plateauScale = 0.06;
      const plateauNoise = Math.sin(x * plateauScale + seed * 50) * Math.cos(z * plateauScale + seed * 50);
      const plateau = plateauNoise > 0.5 ? 1 : 0;

      const valleyScale = 0.08;
      const valleyNoise = Math.sin(x * valleyScale + seed * 60) + Math.sin(z * valleyScale * 1.3 + seed * 61);
      const valley = valleyNoise < -0.7 ? valleyNoise * 0.8 : 0;

      const dist = Math.sqrt(x * x + z * z);
      const erosion = -Math.abs(Math.sin(dist * 0.1 + seed * 70)) * 0.5;
      const microDetail = (Math.sin(x * 0.7 + seed * 80) * Math.cos(z * 0.9 + seed * 81)) * 0.15;

      return (baseHeight + mediumHeight + detailHeight + ridgeHeight + plateau + valley + erosion + microDetail) * HEIGHT_SCALE;
    }

    function getTerrainHeightBlended(x, z) {
      const hA = getTerrainHeight(x, z, terrainSeedA);
      const hB = getTerrainHeight(x, z, terrainSeedB);
      return hA * (1 - terrainMorph) + hB * terrainMorph;
    }

    function getTerrainNormal(x, z) {
      const eps = 0.1;
      const h = getTerrainHeightBlended(x, z);
      const hx = getTerrainHeightBlended(x + eps, z);
      const hz = getTerrainHeightBlended(x, z + eps);
      return new THREE.Vector3(h - hx, eps, h - hz).normalize();
    }

    let objectCenters = [];
    function regenerateObjects() {
      const count = 35;
      const radius = MAX_RANGE * 0.85;
      objectCenters = new Array(count).fill(0).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * radius;
        return {
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          r: 1.5 + Math.random() * 2.5
        };
      });
    }

    function isObjectField(x, z) {
      for (let i = 0; i < objectCenters.length; i++) {
        const o = objectCenters[i];
        const dx = x - o.x;
        const dz = z - o.z;
        if (dx * dx + dz * dz <= o.r * o.r) {
          return true;
        }
      }
      return false;
    }

    function initRingAngles() {
      if (RING_ANGLES.length) return;
      for (let r = 0; r < NUM_RINGS; r++) {
        RING_ANGLES.push(((r / (NUM_RINGS - 1)) - 0.5) * (Math.PI / 6));
      }
    }

    function appendCurrentScanSlice() {
      for (let ring = 0; ring < NUM_RINGS; ring++) {
        const verticalAngle = RING_ANGLES[ring];
        const direction = new THREE.Vector3(
          Math.cos(verticalAngle) * Math.cos(scanAngle),
          Math.sin(verticalAngle),
          Math.cos(verticalAngle) * Math.sin(scanAngle)
        );
        const hit = raycastTerrain(direction);
        if (hit) {
          currentScanPoints.push({
            position: hit.position.clone(),
            ring
          });
        }
      }
    }

    function finalizeScanFrame() {
      accumulatedScans.push({
        points: currentScanPoints,
        vehicleZ
      });
      currentScanPoints = [];
      if (accumulatedScans.length > MAX_ACCUMULATED_SCANS) {
        accumulatedScans.shift();
      }
    }

    function updateAccumulatedScans() {
      const positions = scannedPoints.geometry.attributes.position.array;
      const colors = scannedPoints.geometry.attributes.color.array;
      const sizes = scannedPoints.geometry.attributes.size.array;
      for (let i = 0; i < sizes.length; i++) {
        sizes[i] = 0;
      }
      let pointIndex = 0;
      const maxPoints = positions.length / 3;
      for (let s = 0; s < accumulatedScans.length; s++) {
        const scan = accumulatedScans[s];
        const age = accumulatedScans.length - s - 1;
        const ageFactor = 1 - age / MAX_ACCUMULATED_SCANS;
        const zOffset = vehicleZ - scan.vehicleZ;
        for (let p = 0; p < scan.points.length && pointIndex < maxPoints; p++) {
          const pt = scan.points[p];
          const i3 = pointIndex * 3;
          positions[i3] = pt.position.x;
          positions[i3 + 1] = pt.position.y;
          positions[i3 + 2] = pt.position.z - zOffset;
          sizes[pointIndex] = POINT_SIZE * Math.max(0.2, ageFactor);
          colors[i3] = 249 / 255;
          colors[i3 + 1] = 255 / 255;
          colors[i3 + 2] = 186 / 255;
          pointIndex++;
        }
      }
      if (currentScanPoints.length > 0) {
        for (let p = 0; p < currentScanPoints.length && pointIndex < maxPoints; p++) {
          const pt = currentScanPoints[p];
          const i3 = pointIndex * 3;
          positions[i3] = pt.position.x;
          positions[i3 + 1] = pt.position.y;
          positions[i3 + 2] = pt.position.z;
          sizes[pointIndex] = POINT_SIZE;
          colors[i3] = 249 / 255;
          colors[i3 + 1] = 255 / 255;
          colors[i3 + 2] = 186 / 255;
          pointIndex++;
        }
      }
      scannedPoints.geometry.attributes.position.needsUpdate = true;
      scannedPoints.geometry.attributes.color.needsUpdate = true;
      scannedPoints.geometry.attributes.size.needsUpdate = true;
    }

    function raycastTerrain(direction) {
      for (let dist = 1; dist < MAX_RANGE; dist += 0.25) {
        const point = direction.clone().multiplyScalar(dist);
        const terrainHeight = getTerrainHeightBlended(point.x, point.z);
        if (point.y <= terrainHeight && point.y > terrainHeight - 0.25) {
          if (!isLandscape && !isRings && !isMulti && !isObjectField(point.x, point.z)) {
            return null;
          }
          return {
            position: new THREE.Vector3(point.x, terrainHeight, point.z),
            distance: dist,
            normal: getTerrainNormal(point.x, point.z)
          };
        }
      }
      return null;
    }

    function generateTerrain() {
      terrainPoints = [];
      for (let h = 0; h < SCAN_RESOLUTION; h++) {
        const horizontalAngle = (h / SCAN_RESOLUTION) * Math.PI * 2;
        const verticalHits = [];
        for (let v = 0; v < VERTICAL_RAYS; v++) {
          const verticalAngle = ((v / VERTICAL_RAYS) - 0.5) * (Math.PI / 6);
          const direction = new THREE.Vector3(
            Math.cos(verticalAngle) * Math.cos(horizontalAngle),
            Math.sin(verticalAngle),
            Math.cos(verticalAngle) * Math.sin(horizontalAngle)
          );
          const hit = raycastTerrain(direction);
          if (hit) verticalHits.push(hit);
        }
        for (let i = 0; i < verticalHits.length; i++) {
          const hit = verticalHits[i];
          let occluded = false;
          for (let j = 0; j < verticalHits.length; j++) {
            if (i !== j) {
              const otherHit = verticalHits[j];
              if (hit.distance - otherHit.distance > 5) {
                occluded = true;
                break;
              }
            }
          }
          if (!occluded) {
            const distanceFromCenter = hit.distance;
            const cullProbability = Math.max(0, 1 - (distanceFromCenter / MAX_RANGE));
            const cullStrength = isRings ? 0.05 : 0.3;
            if (Math.random() > cullProbability * cullStrength) {
              terrainPoints.push({
                position: hit.position,
                basePosition: hit.position.clone(),
                angle: horizontalAngle,
                distance: hit.distance,
                normal: hit.normal,
                revealAt: Math.floor(Math.random() * 6)
              });
            }
          }
        }
      }
      totalPoints = terrainPoints.length;
    }

    function createPointCloud() {
      if (isMulti) {
        totalPoints = SCAN_RESOLUTION * NUM_RINGS * MAX_ACCUMULATED_SCANS;
      }
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(totalPoints * 3);
      const colors = new Float32Array(totalPoints * 3);
      const sizes = new Float32Array(totalPoints);
      pointAges = new Array(totalPoints).fill(0);
      for (let i = 0; i < totalPoints; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      const material = new THREE.PointsMaterial({
        size: POINT_SIZE,
        vertexColors: true,
        transparent: false,
        opacity: 1,
        sizeAttenuation: false
      });
      scannedPoints = new THREE.Points(geometry, material);
      scene.add(scannedPoints);
      visiblePoints = 0;
    }

    const SCAN_BEAM_PIXELS = isZoomed ? 3 : 2;

    function updateScanBeamThickness() {
      if (!scanBeam || !renderer || !camera) return;
      const canvasHeight = renderer.domElement.clientHeight || 1;
      const fovRad = camera.fov * Math.PI / 180;
      const camDist = camera.position.length();
      const worldThickness =
        (SCAN_BEAM_PIXELS / canvasHeight) * 2 * camDist * Math.tan(fovRad / 2);
      scanBeam.scale.z = Math.max(worldThickness, 0.001);
    }

    function createScanBeam() {
      // Thin quad lying on X-Z plane, extending from origin in +X (initial orientation)
      // Rotated each frame via scanBeam.rotation.y to track scanAngle
      const geometry = new THREE.PlaneGeometry(MAX_RANGE, 1);
      geometry.translate(MAX_RANGE / 2, 0, 0); // origin at one end
      geometry.rotateX(-Math.PI / 2);          // lay flat (Y → Z)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      scanBeam = new THREE.Mesh(geometry, material);
      scene.add(scanBeam);
      scanBeam.visible = false;
      updateScanBeamThickness();
    }

    function updateScannedPoints() {
      if (isMulti) {
        return;
      }
      const positions = scannedPoints.geometry.attributes.position.array;
      const colors = scannedPoints.geometry.attributes.color.array;
      const sizes = scannedPoints.geometry.attributes.size.array;
      let newPoints = 0;
      const sweepWidth = isRings ? 0.02 : 0.06; // thinner sweep for rings
      
      for (let i = 0; i < terrainPoints.length; i++) {
        const point = terrainPoints[i];
        const angleDiff = (scanAngle - point.angle + Math.PI * 2) % (Math.PI * 2);
        const inSweepBand = angleDiff >= 0 && angleDiff <= sweepWidth;
        
        if (inSweepBand) {
          if (isRings && point.revealAt && ringTurns < point.revealAt) {
            continue;
          }
          const i3 = i * 3;
          positions[i3] = point.position.x;
          positions[i3 + 1] = point.position.y;
          positions[i3 + 2] = point.position.z;
          colors[i3] = 249/255;
          colors[i3 + 1] = 255/255;
          colors[i3 + 2] = 186/255;
          sizes[i] = POINT_SIZE;
          pointAges[i] = scanAngle;
          if (sizes[i] === 0) {
            visiblePoints++;
          }
          newPoints++;
        }
      }
      if (newPoints > 0) {
        scannedPoints.geometry.attributes.position.needsUpdate = true;
        scannedPoints.geometry.attributes.color.needsUpdate = true;
        scannedPoints.geometry.attributes.size.needsUpdate = true;
      }
    }

    function fadePoints() {
      if (isMulti) {
        return;
      }
      const sizes = scannedPoints.geometry.attributes.size.array;
      const colors = scannedPoints.geometry.attributes.color.array;
      let needsUpdate = false;
      const fadeStartAngle = 0;
      const fadeDuration = isRings ? Math.PI * 6 : Math.PI * 4;
      const minFadeFactor = isRings ? 0.7 : 0.35;
      for (let i = 0; i < pointAges.length; i++) {
        if (sizes[i] > 0) {
                    // Wrap age across loop to ensure smooth fading
                    const age = (scanAngle - pointAges[i] + Math.PI * 2) % (Math.PI * 2);
          if (age > fadeStartAngle) {
            const fadeProgress = (age - fadeStartAngle) / fadeDuration;
            const fadeFactor = Math.max(minFadeFactor, Math.pow(1 - fadeProgress, 2.5));
            sizes[i] = POINT_SIZE * fadeFactor;
            const i3 = i * 3;
            // Keep points yellow while fading (avoid dark trailing dots)
            colors[i3] = 249/255;
            colors[i3 + 1] = 255/255;
            colors[i3 + 2] = 186/255;
            needsUpdate = true;
            if (!isRings && (fadeFactor < 0.01 || age > fadeDuration)) {
              sizes[i] = 0;
            }
          }
        }
      }
      if (needsUpdate) {
        scannedPoints.geometry.attributes.size.needsUpdate = true;
        scannedPoints.geometry.attributes.color.needsUpdate = true;
      }
    }

    function clearPointCloud() {
      const positions = scannedPoints.geometry.attributes.position.array;
      const colors = scannedPoints.geometry.attributes.color.array;
      const sizes = scannedPoints.geometry.attributes.size.array;
      for (let i = 0; i < sizes.length; i++) {
        sizes[i] = 0;
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        pointAges[i] = 0;
      }
      scannedPoints.geometry.attributes.position.needsUpdate = true;
      scannedPoints.geometry.attributes.color.needsUpdate = true;
      scannedPoints.geometry.attributes.size.needsUpdate = true;
    }

    let morphTick = 0;

    function morphTerrainPoints() {
      // Update heights only to keep point count stable
      for (let i = 0; i < terrainPoints.length; i++) {
        const p = terrainPoints[i];
        const base = p.basePosition || p.position;
        const warpScale = 3.5;
        const warpAX = Math.sin(base.z * 0.12 + terrainSeedA * 2.7) * warpScale;
        const warpAZ = Math.cos(base.x * 0.12 + terrainSeedA * 3.1) * warpScale;
        const warpBX = Math.sin(base.z * 0.12 + terrainSeedB * 2.7) * warpScale;
        const warpBZ = Math.cos(base.x * 0.12 + terrainSeedB * 3.1) * warpScale;
        const warpX = warpAX * (1 - terrainMorph) + warpBX * terrainMorph;
        const warpZ = warpAZ * (1 - terrainMorph) + warpBZ * terrainMorph;
        p.position.x = base.x + warpX;
        p.position.z = base.z + warpZ;
        p.position.y = getTerrainHeightBlended(p.position.x, p.position.z);
        p.normal = getTerrainNormal(p.position.x, p.position.z);
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      if (scanning) {
        scanAngle += scanSpeed;
        if (isMulti) {
          if (allowDrive) {
            vehicleZ += DRIVE_SPEED;
          }
          scanBeam.rotation.y = -scanAngle;
          scanBeam.visible = true;
          appendCurrentScanSlice();
          if (scanAngle >= Math.PI * 2) {
            finalizeScanFrame();
            scanAngle -= Math.PI * 2;
          }
          updateAccumulatedScans();
          updateUI();
        } else {
          if (!isRings) {
          // Smoothly morph between two different terrains every 2 sweeps
          terrainMorph += scanSpeed / (Math.PI * 2 * 2);
          if (terrainMorph >= 1) {
            terrainMorph -= 1;
            terrainSeedA = terrainSeedB;
            terrainSeedB = Math.random() * 1000;
            regenerateObjects();
          }
          }
          // Throttle morph updates for performance
          morphTick += 1;
          if (!isRings && morphTick % 3 === 0) {
            morphTerrainPoints();
          }
          scanBeam.rotation.y = -scanAngle;
          scanBeam.visible = true;
          updateScannedPoints();
          fadePoints();
          // Move existing point cloud downward to simulate forward motion
          const cloudPositions = scannedPoints.geometry.attributes.position.array;
          const sizes = scannedPoints.geometry.attributes.size.array;
          const OUTWARD_DRIFT = (isRings || isMulti) ? 0 : 0.05;
          for (let i = 0; i < sizes.length; i++) {
            if (sizes[i] > 0) {
              const i3 = i * 3;
              const x = cloudPositions[i3];
              const z = cloudPositions[i3 + 2];
              const len = Math.hypot(x, z) || 1;
              // Radial drift away from center
              cloudPositions[i3] = x + (x / len) * OUTWARD_DRIFT;
              cloudPositions[i3 + 2] = z + (z / len) * OUTWARD_DRIFT;
              if (allowDrive) {
                cloudPositions[i3 + 2] += DRIVE_SPEED;
              }
            }
          }
          scannedPoints.geometry.attributes.position.needsUpdate = true;
          if (scanAngle >= Math.PI * 2) {
            if (autoLoop) {
              // Continuous loop with slow morph, no hard reset
              scanAngle -= Math.PI * 2;
              if (isRings) {
                ringTurns += 1;
              }
              for (let i = 0; i < pointAges.length; i++) {
                pointAges[i] -= Math.PI * 2;
              }
              updateStatus('SCANNING...');
            } else {
              scanning = false;
              scanAngle = Math.PI * 2;
              scanBeam.visible = false;
              updateStatus('SCAN COMPLETE');
            }
          }
          updateUI();
        }
      }
      renderer.render(scene, camera);
    }

    function init() {
      scene = new THREE.Scene();
      // fog disabled for transparent background
      camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
      setCamera();
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      canvasHost.appendChild(renderer.domElement);
      regenerateObjects();
      if (isMulti) {
        initRingAngles();
        accumulatedScans = [];
        vehicleZ = 0;
      }

      const resize = () => {
        const width = canvasHost.clientWidth;
        const height = canvasHost.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        updateScanBeamThickness();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvasHost);

      if (!isMulti) {
        generateTerrain();
      }
      createPointCloud();
      createScanBeam();
      updateStatus('READY');
      animate();
      setTimeout(startScan, 500);
    }

    function startScan() {
      if (!scanning) {
        if (scanAngle >= Math.PI * 2) resetScan();
        scanning = true;
        autoLoop = true;
        updateStatus('SCANNING...');
      }
    }

    function pauseScan() {
      scanning = false;
      autoLoop = false;
      updateStatus('PAUSED');
    }

    function resetScan() {
      scanning = false;
      autoLoop = false;
      scanAngle = 0;
      visiblePoints = 0;
      if (isMulti) {
        accumulatedScans = [];
        currentScanPoints = [];
        vehicleZ = 0;
      }
      clearPointCloud();
      scanBeam.visible = false;
      updateStatus('READY');
      updateUI();
    }

    function changeSpeed() {
      speedMode = (speedMode + 1) % 3;
      const speeds = [0.01, 0.03, 0.06];
      scanSpeed = speeds[speedMode];
    }

    function changeTerrain() {
      terrainSeed = Math.random();
      generateTerrain();
      resetScan();
      scene.remove(scannedPoints);
      createPointCloud();
    }

    function toggleView() {
      viewMode = (viewMode + 1) % 2;
      setCamera();
    }

    // No UI controls when hidden

    init();
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════════
// 💥 DISPERSE GRID  ── new animation
// ════════════════════════════════════════════════════════════════════════════════
// Scroll-linked 3-stage animation that runs on any [data-disperse="section"]
// holding exactly 16 [data-disperse="cell"] children.
//
//   Stage 1: 2×2 grid of 4 "master" cells (15vw each)            (cells 1,3,9,11)
//   Stage 2: burst — replicate into 4×4 grid of 16 cells (7.5vw)
//   Stage 3: disperse — cells scatter into viewport quadrants with jitter
//   Tail:    entire section translates up off-screen before pin release
//
// WEBFLOW MARKUP:
//   <section data-disperse="section">
//     [optional] <div data-disperse="bg"><img ...></div>      ← fades in stage 3
//     [optional] <div data-disperse="bounds" class="u-container">  ← sets grid width
//                  (any Lumos container or fixed-width element)
//     <div data-disperse="cell"> … your image + text … </div>   × 16 cells total
//   </section>
//
// If a [data-disperse="bounds"] element is present, the 2×2 and 4×4 grids fit
// exactly within its width (stage 3 disperse still spreads across the full
// section / viewport). If absent, the section's own width is used.
//
// CELLS:
//   - Tag with data-disperse="cell" on the wrapper div (NOT the <img>).
//     Everything inside moves/scales together.
//   - Cells are absolutely-positioned at runtime; any Webflow grid/flex on
//     the section is overridden.
//   - Cell INTERNALS (img/text) must scale relatively — image width:100%,
//     text in em/% — so they resize with the cell wrapper.
//   - MASTERS: by default, cells at document positions 1, 3, 9, 11 (the
//     "top-left of each 2×2 quadrant" in a 4×4 grid).
//     To override explicitly: tag those 4 with data-disperse="cell-master".
//
// DEPENDENCIES: GSAP (loaded by Webflow) + ScrollTrigger (loaded on demand here).
// ════════════════════════════════════════════════════════════════════════════════

function loadScrollTrigger() {
  return new Promise((resolve, reject) => {
    if (typeof ScrollTrigger !== 'undefined') {
      try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}
      console.log('✅ ScrollTrigger already loaded (skipping CDN fetch)');
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
    script.onload = () => {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        console.log('✅ ScrollTrigger loaded and registered');
        resolve();
      } else {
        reject('ScrollTrigger not found after load');
      }
    };
    script.onerror = () => reject('Failed to load ScrollTrigger');
    document.head.appendChild(script);
  });
}

function injectDisperseStyles() {
  if (document.getElementById('disperse-styles')) return;
  const style = document.createElement('style');
  style.id = 'disperse-styles';
  style.textContent = `
    /* No !important on position — ScrollTrigger needs to flip it to fixed
       during pin, and inline pin styles must be allowed to win. */
    [data-disperse="section"] {
      position: relative;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      min-height: 100vh !important;
      overflow: hidden !important;
      display: block !important;
    }
    /* Use !important to override Lumos utility classes like u-display-contents
       which would otherwise neutralize absolute positioning on the cell wrapper. */
    [data-disperse="cell"],
    [data-disperse="cell-master"] {
      display: block !important;
      position: absolute !important;
      left: 50%;
      top: 50%;
      transform-origin: center center;
      will-change: transform;
      opacity: 0;
    }
    /* Ensure media inside the cell fills the cell wrapper, so the image
       scales as the cell resizes from 15vw → 7.5vw → final size. */
    [data-disperse="cell"] img,
    [data-disperse="cell-master"] img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    [data-disperse="bg"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      pointer-events: none;
      z-index: 0;
    }
    [data-disperse="bg"] img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `;
  document.head.appendChild(style);
}

// Find a Lenis-like smooth-scroll instance on the page (Lumos's data-smooth-scroll
// initializes one but doesn't always expose it under a predictable name).
function findSmoothScroller() {
  const candidates = [
    window.lenis, window.Lenis, window.lumosLenis, window._lenis,
    window.smoothScroll, window.scroll, window.lumos
  ].filter(Boolean);
  for (const c of candidates) {
    if (c && typeof c.on === 'function' && typeof c.raf === 'function') return c;
  }
  // Last resort — scan window globals for anything with Lenis's shape
  try {
    for (const key of Object.keys(window)) {
      const v = window[key];
      if (v && typeof v === 'object' &&
          typeof v.on === 'function' &&
          typeof v.raf === 'function' &&
          'scroll' in v) {
        return v;
      }
    }
  } catch (e) {}
  return null;
}

function integrateSmoothScrollWithScrollTrigger() {
  if (window._dispersScrollIntegrated) return;
  const lenis = findSmoothScroller();
  if (lenis) {
    window._dispersScrollIntegrated = true;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    console.log('🔗 DISPERSE: integrated ScrollTrigger with detected smooth-scroll instance');
    return true;
  }
  // Fallback: ask ScrollTrigger to take over scroll normalization itself.
  if (typeof ScrollTrigger.normalizeScroll === 'function') {
    ScrollTrigger.normalizeScroll(true);
    window._dispersScrollIntegrated = true;
    console.log('🔗 DISPERSE: no smooth-scroll instance found, enabled ScrollTrigger.normalizeScroll instead');
    return true;
  }
  return false;
}

async function initDisperse() {
  const sections = document.querySelectorAll('[data-disperse="section"]');
  if (sections.length === 0) return;

  try {
    await loadScrollTrigger();
  } catch (err) {
    console.error('❌ DISPERSE: failed to load ScrollTrigger', err);
    return;
  }

  // Smooth-scroll integration disabled for now — re-enable if pin fails on a
  // page that uses Webflow/Lumos data-smooth-scroll="true".
  // if (document.body.dataset.smoothScroll === 'true' ||
  //     document.documentElement.dataset.smoothScroll === 'true') {
  //   integrateSmoothScrollWithScrollTrigger();
  // }

  injectDisperseStyles();

  sections.forEach((section) => {
    if (section.dataset.disperseInitialized === 'true') return;
    section.dataset.disperseInitialized = 'true';

    // Find cells in document order — both "cell" and "cell-master" variants
    const cells = Array.from(section.querySelectorAll(
      '[data-disperse="cell"], [data-disperse="cell-master"]'
    ));
    if (cells.length !== 16) {
      console.warn(`⚠️ DISPERSE: expected 16 cells, got ${cells.length}`, section);
      return;
    }

    // Optional bounds element — its width sizes the 2×2 and 4×4 grids.
    // Stage 3 disperse still scatters across the full section (viewport).
    // If absent, falls back to the section's own width.
    const boundsEl = section.querySelector('[data-disperse="bounds"]');

    // Cells must be DIRECT children of the section so absolute positioning
    // anchors to the section, not to an intermediate position:relative wrapper
    // (e.g. Lumos's u-position-relative). If not, hoist them.
    const nonDirect = cells.filter(c => c.parentElement !== section);
    if (nonDirect.length > 0) {
      console.warn(
        `⚠️ DISPERSE: ${nonDirect.length}/${cells.length} cells are nested inside ` +
        `wrapper elements — hoisting them to be direct children of the section. ` +
        `For predictable layout, structure as: <section data-disperse="section"> ` +
        `→ 16 × <div data-disperse="cell"> as direct children (no Lumos grid/column wrappers).`
      );
      cells.forEach(c => { if (c.parentElement !== section) section.appendChild(c); });
    }

    const bg = section.querySelector('[data-disperse="bg"]');

    // ─── CONFIG (hardcoded — defaults from the tuned demo) ───────────────
    const COLS = 4, ROWS = 4, N = 16;
    // The 2×2 and 4×4 grids fit the bounds element exactly: cells fill
    // remaining horizontal space after the Lumos gutter. Cell height follows
    // the first Webflow media wrapper's aspect-ratio (16 / 9 by default).
    const DEFAULT_ASPECT_RATIO = 16 / 9;
    const STAGGER        = 0.02;
    const SPREAD         = 12;
    const SIZE_MIN       = 10;
    const SIZE_MAX       = 20;
    const EASE           = 'expo.inOut';
    // ─── Demo "triggered" defaults (verbatim) ────────────────────
    const PACE                = 1500;
    const HOLD_START          = 0;
    const HOLD_MID            = 0.4;
    const HOLD_END            = 0;
    const TAIL_HOLD           = 0.5;
    const STAGE1_DWELL        = 0.15;
    const BURST_PLAY          = 0.7;
    const TRIGGERED_DURATION  = 1.2;
    const SEED                = 17;

    // ─── MASTER DETECTION ─────────────────────────────────────────────────
    // If any cell carries data-disperse="cell-master", use those; otherwise
    // fall back to document positions 0, 2, 8, 10 (top-left of each quadrant).
    const explicit = cells.map(c => c.getAttribute('data-disperse') === 'cell-master');
    const hasExplicit = explicit.some(Boolean);
    const isMaster = (i) =>
      hasExplicit ? explicit[i] : (i === 0 || i === 2 || i === 8 || i === 10);

    // ─── SEEDED RANDOM (stable jitter across reloads) ─────────────────────
    let _seed = SEED;
    const rand = () => { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; };
    const rng = (a, b) => a + rand() * (b - a);

    // ─── STAGE 3 END POSITIONS ────────────────────────────────────────────
    let endStates = [];
    const computeEndStates = () => {
      _seed = SEED; // reset for deterministic positions
      endStates = Array.from({ length: N }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const anchorX = (col + 0.5) * (100 / COLS);
        const anchorY = (row + 0.5) * (100 / ROWS);
        return {
          x: anchorX + rng(-SPREAD, SPREAD),
          y: anchorY + rng(-SPREAD, SPREAD),
          size: rng(SIZE_MIN, SIZE_MAX)
        };
      });
    };

    // Read the current bounds width — falls back to the section's width.
    const getBoundsWidth = () =>
      (boundsEl && boundsEl.getBoundingClientRect().width) ||
      section.getBoundingClientRect().width ||
      window.innerWidth;

    const resolveCssLengthPx = (value, contextEl = section) => {
      const raw = String(value || '').trim();
      if (!raw || raw === 'normal') return 0;

      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.pointerEvents = 'none';
      probe.style.width = raw;
      contextEl.appendChild(probe);
      const px = probe.getBoundingClientRect().width;
      probe.remove();

      return Number.isFinite(px) ? px : 0;
    };

    // Read Lumos' design-system gutter token directly. Computed custom
    // properties can remain as clamp()/calc(), so resolve through layout.
    const getGapPx = () => {
      const tokenSource = boundsEl || section;
      const siteGutter = getComputedStyle(tokenSource).getPropertyValue('--site--gutter');
      const tokenPx = resolveCssLengthPx(siteGutter, tokenSource);
      if (tokenPx > 0) return tokenPx;

      const cs = getComputedStyle(tokenSource);
      return resolveCssLengthPx(cs.columnGap || cs.gap, tokenSource);
    };

    const parseAspectRatio = (value) => {
      const raw = String(value || '').trim();
      if (!raw || raw === 'auto') return 0;

      const parts = raw.split('/').map(part => parseFloat(part));
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        return parts[0] / parts[1];
      }

      const numeric = parseFloat(raw);
      return numeric > 0 ? numeric : 0;
    };

    const getCellAspectRatio = () => {
      for (const cell of cells) {
        const media = cell.querySelector('.u-image-wrapper, .u-video, [class*="u-ratio-"], img, video');
        const ratio = parseAspectRatio(media && getComputedStyle(media).aspectRatio);
        if (ratio > 0) return ratio;
      }
      return DEFAULT_ASPECT_RATIO;
    };

    const getCellMetrics = () => {
      const bw = getBoundsWidth();
      const gapPx = getGapPx();
      const ratio = getCellAspectRatio();
      const cell1Width = (bw - gapPx) / 2;
      const cell2Width = (bw - 3 * gapPx) / 4;
      const cell1Height = cell1Width / ratio;
      const cell2Height = cell2Width / ratio;

      return {
        gapPx,
        cell1Width,
        cell1Height,
        cell2Width,
        cell2Height,
        stage1PitchX: cell1Width + gapPx,
        stage1PitchY: cell1Height + gapPx,
        stage2PitchX: cell2Width + gapPx,
        stage2PitchY: cell2Height + gapPx,
        ratio
      };
    };

    // ─── STAGE 1 LAYOUT (2×2 grid of masters at quadrant centers) ─────────
    const layoutInitial = () => {
      const metrics = getCellMetrics();
      cells.forEach((cell, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const qcol = Math.floor(col / 2);
        const qrow = Math.floor(row / 2);
        const master = isMaster(i);
        const qx = (qcol - 0.5) * metrics.stage1PitchX;
        const qy = (qrow - 0.5) * metrics.stage1PitchY;
        gsap.set(cell, {
          display: 'block',
          position: 'absolute',
          left: '50%',
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          x: qx,
          y: qy,
          width:  `${master ? metrics.cell1Width : metrics.cell2Width}px`,
          height: `${master ? metrics.cell1Height : metrics.cell2Height}px`,
          scale: master ? 1 : 0.7,
          opacity: master ? 1 : 0,
          transformOrigin: 'center center'
        });
      });
    };

    // ─── BUILD ────────────────────────────────────────────────────────────
    let tl = null;
    const build = () => {
      if (tl) {
        if (tl._triggers) tl._triggers.forEach(t => t.kill());
        if (tl._children) tl._children.forEach(c => c.kill());
        tl = null;
      }
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars && t.vars.trigger === section) t.kill();
      });
      gsap.killTweensOf(cells);
      if (bg) { gsap.killTweensOf(bg); bg.style.opacity = '0'; }
      // Lock section dimensions inline — overrides any Webflow class CSS
      // (e.g. height: auto, display: flex with flex children gone absolute).
      gsap.set(section, {
        y: 0,
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'block'
      });

      computeEndStates();
      layoutInitial();

      const metrics = getCellMetrics();

      // ─ Burst (stage 1 → 2): build the paused timeline directly, same as
      //   the demo's triggered branch. Master shrinks + slides; non-masters
      //   pop into their slot and fade in.
      const QUAD_STAGGER    = 0.07;
      const MASTER_DUR      = 0.30;
      const NONMASTER_DUR   = 0.22;
      const NONMASTER_DELAY = 0.18;
      const SUB_STAGGER     = 0.06;

      const burstTl = gsap.timeline({ paused: true });
      cells.forEach((cell, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const sx  = (col - (COLS - 1) / 2) * metrics.stage2PitchX;
        const sy  = (row - (ROWS - 1) / 2) * metrics.stage2PitchY;
        const qcol = Math.floor(col / 2);
        const qrow = Math.floor(row / 2);
        const qx = (qcol - 0.5) * metrics.stage1PitchX;
        const qy = (qrow - 0.5) * metrics.stage1PitchY;
        const quadIdx   = qrow * 2 + qcol;
        const quadStart = quadIdx * QUAD_STAGGER;

        if (isMaster(i)) {
          // Master: explicit fromTo so reverse always returns to stage-1 size
          burstTl.fromTo(cell,
            {
              x: qx, y: qy,
              width:  `${metrics.cell1Width}px`,
              height: `${metrics.cell1Height}px`
            },
            {
              x: sx, y: sy,
              width:  `${metrics.cell2Width}px`,
              height: `${metrics.cell2Height}px`,
              duration: MASTER_DUR,
              ease: 'power3.inOut',
              immediateRender: false
            }, quadStart);
        } else {
          const subIdx  = (row % 2) * 2 + (col % 2);
          const startAt = quadStart + NONMASTER_DELAY + (subIdx - 1) * SUB_STAGGER;
          // Non-master: fromTo with explicit from state (hidden at qx,qy)
          // and explicit to state (visible at sx,sy at stage 2 size).
          burstTl.fromTo(cell,
            {
              x: qx, y: qy,
              opacity: 0,
              scale: 0.7
            },
            {
              x: sx, y: sy,
              opacity: 1,
              scale: 1,
              duration: NONMASTER_DUR,
              ease: 'power2.out',
              immediateRender: false
            }, startAt);
        }
      });

      // ─ Disperse (stage 2 → stage 3): scrubbed into the main timeline
      const animateStage2to3 = (timeline, baseTime, duration) => {
        cells.forEach((cell, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const sx  = (col - (COLS - 1) / 2) * metrics.stage2PitchX;
          const sy  = (row - (ROWS - 1) / 2) * metrics.stage2PitchY;
          const e   = endStates[i];
          timeline.fromTo(cell,
            {
              x: sx, y: sy,
              width:  `${metrics.cell2Width}px`,
              height: `${metrics.cell2Height}px`,
              opacity: 1,
              left: '50%', top: '50%'
            },
            {
              left: `${e.x}%`,
              top:  `${e.y}%`,
              x: 0, y: 0,
              width:  `${e.size}vw`,
              height: `${e.size / metrics.ratio}vw`,
              duration,
              ease: EASE,
              immediateRender: false
            },
            baseTime + i * STAGGER
          );
        });
      };

      // ─ Disperse timeline (stage 2 → 3) — paused, autonomous play
      const disperseTl = gsap.timeline({ paused: true });
      animateStage2to3(disperseTl, 0, TRIGGERED_DURATION * 0.7);
      if (bg) {
        disperseTl.fromTo(bg,
          { opacity: 0 },
          { opacity: 1, duration: TRIGGERED_DURATION * 0.7, ease: 'power2.inOut' },
          0);
      }

      // Pin range divided into equal thirds: stage 1 visible | stage 2 visible | stage 3 visible
      const totalPx         = 3000;       // 1000px per stage
      const burstTrigger    = 1 / 3;      // burst fires at 33%
      const disperseTrigger = 2 / 3;      // disperse fires at 67%
      let burstFired    = false;
      let disperseFired = false;

      // Track child timelines + pin so build() can kill everything cleanly.
      // Do NOT add burstTl/disperseTl to a parent — that would auto-play them.
      tl = { _children: [burstTl, disperseTl], _triggers: [] };

      const pinTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end:   `+=${totalPx}`,
        pin:   true,
        pinSpacing: 'margin',
        pinType: 'fixed',
        pinReparent: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress, dir = self.direction;

          // ─ Burst forward (stage 1 → 2)
          if (!burstFired && dir === 1 && p >= burstTrigger) {
            burstTl.play();
            burstFired = true;
          }
          // ─ Burst reverse (back to stage 1)
          else if (burstFired && dir === -1 && p < burstTrigger) {
            // Snap disperse to its start state first — cells go to stage 2
            // cleanly, then burst can reverse them to stage 1 without conflict.
            if (disperseFired) {
              disperseTl.pause(0);
              disperseFired = false;
            }
            burstTl.reverse();
            burstFired = false;
          }

          // ─ Disperse forward (stage 2 → 3)
          if (!disperseFired && dir === 1 && p >= disperseTrigger) {
            // Force burst to completion first — cells go to stage 2 instantly,
            // then disperse takes over cleanly.
            if (burstTl.progress() < 1) burstTl.pause(burstTl.duration());
            burstFired = true;
            disperseTl.play();
            disperseFired = true;
          }
          // ─ Disperse direction flips (handle back-and-forth scrubbing)
          if (disperseFired) {
            if (dir === 1 && disperseTl.reversed()) {
              disperseTl.play();
            } else if (dir === -1 && !disperseTl.reversed() && disperseTl.progress() > 0) {
              disperseTl.reverse();
            }
          }
        },
        onLeaveBack: () => {
          // User scrolled above the section — reset everything to stage 1.
          disperseTl.pause(0);
          burstTl.pause(0);
          burstFired    = false;
          disperseFired = false;
        }
      });

      tl._triggers = [pinTrigger];

      ScrollTrigger.refresh();
    };

    build();

    // ─── RESIZE (debounced rebuild) ───────────────────────────────────────
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 250);
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// END OF DISPERSE GRID
// ════════════════════════════════════════════════════════════════════════════════

// Try to start auto-scroll if DOM is already loaded (for direct page loads)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('📄 DOM already ready, initializing standalone auto-scroll...');
  initStandaloneAutoScroll();
  initLandingScrollOpacity();
  initMarquee();
  initTextType();
  initRadialOverlay();
  initLidarScanners();
  initDisperse();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded (standalone), initializing auto-scroll...');
    initStandaloneAutoScroll();
    initLandingScrollOpacity();
    initMarquee();
    initTextType();
    initRadialOverlay();
    initLidarScanners();
    initDisperse();
  });
}
