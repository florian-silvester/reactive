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
    targets.forEach(({ navWrap, target, isInner }) => {
      target.dataset.navState = 'shrunk';
      const parentWidth = navWrap.parentElement ? navWrap.parentElement.clientWidth : 0;
      const targetWidth = parentWidth ? parentWidth * 0.5 : 0;
      gsap.to(target, {
        width: targetWidth ? `${targetWidth}px` : '50%',
        maxWidth: targetWidth ? `${targetWidth}px` : '50%',
        ...(isInner ? {} : { flexBasis: targetWidth ? `${targetWidth}px` : '50%' }),
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  };

  const animateExpand = () => {
    isShrunk = false;
    accumulatedDelta = 0;
    targets.forEach(({ navWrap, target, isInner }) => {
      target.dataset.navState = 'wide';
      const parentWidth = navWrap.parentElement ? navWrap.parentElement.clientWidth : 0;
      const currentWidth = target.getBoundingClientRect().width;
      gsap.to(target, {
        width: parentWidth ? `${parentWidth}px` : '100%',
        maxWidth: parentWidth ? `${parentWidth}px` : '100%',
        ...(isInner ? {} : { flexBasis: parentWidth ? `${parentWidth}px` : '100%' }),
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
        onStart: () => {
          // lock current width to avoid snap before tween
          target.style.width = `${currentWidth}px`;
          target.style.maxWidth = `${currentWidth}px`;
          if (!isInner) {
            target.style.flexBasis = `${currentWidth}px`;
          }
        }
      });
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

  const updateTargetFromEvent = (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    targetX = Math.max(0, Math.min(100, x));
    targetY = Math.max(0, Math.min(100, y));
    lastMoveTime = Date.now();
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
      if (isIdle) {
        idleProgress = Math.min(1, idleProgress + 0.03);
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
    const POINT_SIZE = isZoomed ? 0.22 : 0.12;
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
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
      });
      scannedPoints = new THREE.Points(geometry, material);
      scene.add(scannedPoints);
      visiblePoints = 0;
    }

    function createScanBeam() {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(6);
      vertices[0] = 0; vertices[1] = 0; vertices[2] = 0;
      vertices[3] = 0; vertices[4] = 0; vertices[5] = MAX_RANGE;
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });
      scanBeam = new THREE.Line(geometry, material);
      scene.add(scanBeam);
      scanBeam.visible = false;
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
          const beamEnd = new THREE.Vector3(
            Math.cos(scanAngle) * MAX_RANGE,
            0,
            Math.sin(scanAngle) * MAX_RANGE
          );
          const beamPositions = scanBeam.geometry.attributes.position.array;
          beamPositions[3] = beamEnd.x;
          beamPositions[5] = beamEnd.z;
          scanBeam.geometry.attributes.position.needsUpdate = true;
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
          const beamEnd = new THREE.Vector3(
            Math.cos(scanAngle) * MAX_RANGE,
            0,
            Math.sin(scanAngle) * MAX_RANGE
          );
          const beamPositions = scanBeam.geometry.attributes.position.array;
          beamPositions[3] = beamEnd.x;
          beamPositions[5] = beamEnd.z;
          scanBeam.geometry.attributes.position.needsUpdate = true;
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

// Try to start auto-scroll if DOM is already loaded (for direct page loads)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('📄 DOM already ready, initializing standalone auto-scroll...');
  initStandaloneAutoScroll();
  initLandingScrollOpacity();
  initMarquee();
  initTextType();
  initRadialOverlay();
  initLidarScanners();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded (standalone), initializing auto-scroll...');
    initStandaloneAutoScroll();
    initLandingScrollOpacity();
    initMarquee();
    initTextType();
    initRadialOverlay();
    initLidarScanners();
  });
}
