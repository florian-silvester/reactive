console.log('🎨 Animations.js loaded');

// Global array to store slider instances
let sliderInstances = [];

// Global scroll position storage
let scrollPositions = {};

// Wait for DOM to be ready
$(document).ready(function() {
  console.log('📱 DOM ready - animations.js connected to Webflow');
  
  // Initialize components immediately for direct page loads
  setTimeout(() => {
    initializeSliders();
  }, 100);
  
  // Initialize Barba after a small delay
  setTimeout(() => {
    initializeBarba();
  }, 200);
  
});

// ===== GSAP SLIDER IMPLEMENTATION =====
function destroySliders() {
  console.log('🗑️ Destroying existing slider instances...');
  
  // Clean up event listeners and animations
  sliderInstances.forEach(instance => {
    if (instance.cleanup) {
      instance.cleanup();
    }
  });
  
  // Clear the instances array
  sliderInstances = [];
  
  console.log('✅ Slider instances destroyed');
}

function initializeSliders() {
  console.log('🎯 Initializing GSAP sliders...');
  
  // PREVENT FLASH: Set initial CSS immediately
  const sliderCSS = `
    <style id="gsap-slider-css">
      .swiper {
        position: relative;
        overflow: hidden;
      }
      .swiper-wrapper {
        display: flex !important;
        width: 100% !important;
        height: 100% !important;
        transition: none !important;
      }
      .swiper-slide {
        flex-shrink: 0 !important;
        display: block !important;
        width: 100% !important;
      }
      /* PREVENT IMAGE FLICKERING */
      .swiper-slide img {
        transition: none !important;
        transform: none !important;
        width: 100%;
        height: auto;
        display: block;
      }
      @media (min-width: 992px) {
        .swiper-slide {
          width: 50% !important;
        }
      }
      /* Hide navigation until GSAP creates it */
      .slider-prev,
      .slider-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: rgba(0,0,0,0.5);
        color: white;
        border: none;
        padding: 10px 15px;
        cursor: pointer;
        font-size: 18px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .slider-prev { left: 10px; }
      .slider-next { right: 10px; }
      .slider-prev:hover,
      .slider-next:hover {
        background: rgba(0,0,0,0.7);
      }
      .slider-prev.disabled,
      .slider-next.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    </style>
  `;
  
  // Remove existing styles and add new ones
  $('#gsap-slider-css').remove();
  $('head').append(sliderCSS);
  
  // DEBUG: Check what we have in the DOM
  console.log('🔍 DEBUG - DOM Analysis:');
  console.log('  - Slider containers found:', $('.swiper').length);
  console.log('  - Slider wrappers found:', $('.swiper-wrapper').length);
  console.log('  - Slider slides found:', $('.swiper-slide').length);
  
  // First destroy any existing sliders
  destroySliders();
  
  // Shorter delay since CSS is already applied
  setTimeout(() => {
    $('.swiper').each(function(index) {
      console.log(`🎠 Setting up GSAP slider ${index + 1}`);
      
      const $slider = $(this);
      const $wrapper = $slider.find('.swiper-wrapper');
      const $slides = $slider.find('.swiper-slide');
      
      // Skip if no slides found
      if (!$slides.length) {
        console.warn(`❌ No slides found in slider ${index + 1}`);
        return;
      }
      
      console.log(`🔍 Slider ${index + 1} structure:`, {
        slider: $slider.length,
        wrapper: $wrapper.length,
        slides: $slides.length
      });
      
      // Get responsive settings
      const isMobile = window.innerWidth < 992;
      const slidesPerView = isMobile ? 1 : 2;
      const slideWidth = 100 / slidesPerView;
      
      let currentSlide = 0;
      const totalSlides = $slides.length;
      const maxSlide = Math.max(0, totalSlides - slidesPerView);
      
      console.log(`📊 Slider ${index + 1} config:`, {
        slidesPerView,
        slideWidth,
        totalSlides,
        maxSlide,
        isMobile
      });
      
      // Create navigation buttons (if they don't exist)
      let $prevBtn = $slider.find('.slider-prev, .swiper-prev');
      let $nextBtn = $slider.find('.slider-next, .swiper-next');
      
      // If no nav buttons found, create them
      if (!$prevBtn.length || !$nextBtn.length) {
        $slider.append(`
          <button class="slider-prev">←</button>
          <button class="slider-next">→</button>
        `);
        $prevBtn = $slider.find('.slider-prev');
        $nextBtn = $slider.find('.slider-next');
      }
      
      // Show navigation buttons
      gsap.set([$prevBtn, $nextBtn], { opacity: 1 });
      
      // Animation function
      function updateSlider(direction = 0) {
        const offset = -(currentSlide * slideWidth);
        
        gsap.to($wrapper, {
          x: offset + '%',
          duration: 0.4,  // Faster: was 0.6
          ease: "power2.inOut"  // Snappier: was "power2.out"
        });
        
        // With looping enabled, buttons are never disabled
        $prevBtn.removeClass('disabled');
        $nextBtn.removeClass('disabled');
        
        console.log(`📱 Slider ${index + 1} moved to slide ${currentSlide} (offset: ${offset}%)`);
      }
      
      // Navigation handlers
      function goToPrev() {
        if (currentSlide > 0) {
          currentSlide--;
        } else {
          // LOOP: Go to last slide when at first slide
          currentSlide = maxSlide;
        }
        updateSlider();
      }
      
      function goToNext() {
        if (currentSlide < maxSlide) {
          currentSlide++;
        } else {
          // LOOP: Go to first slide when at last slide
          currentSlide = 0;
        }
        updateSlider();
      }
      
      // Bind events
      $prevBtn.on('click', goToPrev);
      $nextBtn.on('click', goToNext);
      
      // Keyboard navigation
      $(document).on('keydown.slider' + index, function(e) {
        if (e.key === 'ArrowLeft') goToPrev();
        if (e.key === 'ArrowRight') goToNext();
      });
      
      // Handle window resize
      function handleResize() {
        const newIsMobile = window.innerWidth < 992;
        const newSlidesPerView = newIsMobile ? 1 : 2;
        const newSlideWidth = 100 / newSlidesPerView;
        const newMaxSlide = Math.max(0, totalSlides - newSlidesPerView);
        
        // Update slide widths via CSS
        if (newIsMobile) {
          $slides.css('width', '100%');
        } else {
          $slides.css('width', '50%');
        }
        
        // Adjust current slide if needed (with looping, just ensure it's within bounds)
        if (currentSlide > newMaxSlide) {
          currentSlide = newMaxSlide;
        }
        
        // Update position
        const offset = -(currentSlide * newSlideWidth);
        gsap.set($wrapper, { x: offset + '%' });
        
        console.log(`📐 Slider ${index + 1} resized: ${newSlidesPerView} slides per view (looping enabled)`);
      }
      
      $(window).on('resize.slider' + index, handleResize);
      
      // Initial update
      updateSlider();
      
      // PRELOAD IMAGES: Load adjacent slides to prevent delays
      function preloadSlideImages() {
        $slides.each(function(index) {
          const $img = $(this).find('img');
          if ($img.length) {
            // Force image loading by accessing the src
            const img = new Image();
            img.src = $img.attr('src');
            console.log(`🖼️ Preloading image for slide ${index + 1}`);
          }
        });
      }
      
      // Preload all images immediately
      preloadSlideImages();
      
      // Store cleanup function
      const cleanup = function() {
        $prevBtn.off('click');
        $nextBtn.off('click');
        $(document).off('keydown.slider' + index);
        $(window).off('resize.slider' + index);
        console.log(`🧹 Slider ${index + 1} cleaned up`);
      };
      
      sliderInstances.push({ cleanup, element: $slider });
      
      console.log(`✅ GSAP slider ${index + 1} initialized successfully`);
    });
    
    console.log(`🎯 Total GSAP sliders created: ${sliderInstances.length}`);
    
  }, 50); // Much shorter delay since CSS prevents flash
  
  console.log('✅ GSAP sliders setup started');
}

// ===== BARBA.JS PAGE TRANSITIONS =====
function initializeBarba() {
  console.log('🎭 Initializing Barba.js transitions...');
  
  barba.init({
    transitions: [
      {
        name: 'fade-transition',
        leave(data) {
          console.log('🚪 Leaving page:', data.current.url.path);
          
          // Store current scroll position
          scrollPositions[data.current.url.path] = window.scrollY;
          console.log(`📍 Stored scroll position: ${window.scrollY} for ${data.current.url.path}`);
          
          // Destroy sliders before leaving
          destroySliders();
          
          // Simple fade out - no movement, no scaling
          return gsap.to(data.current.container, {
            opacity: 0,
            x: 0,     // Force no horizontal movement
            y: 0,     // Force no vertical movement
            scale: 1, // Force no scaling
            duration: 0.4,
            ease: "power2.inOut"
          });
        },

        enter(data) {
          console.log('🎯 Entering page:', data.next.url.path);
          
          // Check if this is a slider page (has .swiper elements)
          const isSliderPage = data.next.container.querySelector('.swiper');
          
          if (isSliderPage) {
            console.log('🎠 Detected slider page - using modal-style scale transition');
            
            // EXACT same animation as modal opening in animations_old.js
            const pageAnimation = gsap.fromTo(data.next.container, 
              { opacity: 0, scale: 0.3 },
              {
                opacity: 1,
                scale: 1,
                duration: 0.5,  // Faster: was 0.8
                ease: "expo.inOut",
                onComplete: function() {
                  // Initialize sliders after page is visible
                  initializeSliders();
                  
                  // Stagger slides in (faster timing)
                  const slides = data.next.container.querySelectorAll('.swiper-slide');
                  gsap.fromTo(slides, 
                    { opacity: 0, y: 0, scale: 0.8 },
                    {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      duration: 0.4,  // Faster: was 0.5
                      stagger: 0.15,  // Tighter: was 0.2
                      delay: 0.05     // Shorter: was 0.1
                    }
                  );
                }
              }
            );
            
            return pageAnimation;
            
          } else {
            // Regular fade transition for non-slider pages  
            gsap.set(data.next.container, {
              opacity: 0,
              y: 50
            });
            
            return gsap.to(data.next.container, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              delay: 0.1
            });
          }
        },
        
        after(data) {
          console.log('🔄 After transition complete');
          
          // Restore scroll position if we have one stored
          const storedPosition = scrollPositions[data.next.url.path];
          if (storedPosition !== undefined) {
            console.log(`📍 Restoring scroll position: ${storedPosition} for ${data.next.url.path}`);
            window.scrollTo(0, storedPosition);
          } else {
            console.log('📍 No stored position, staying at top');
          }
        }
      }
    ],
    
    views: [
      {
        namespace: 'home',
        afterEnter() {
          console.log('🏠 Home page loaded');
          animateHomePage();
        }
      },
      {
        namespace: 'contact',
        afterEnter() {
          console.log('📧 Contact page loaded');
          animateContactPage();
        }
      }
    ]
  });
  
  console.log('✅ Barba.js initialized successfully!');
}

// ===== SLIDER ENTRANCE ANIMATION =====
function animateSliderEntrance() {
  console.log('✨ Animating slider entrance with stagger');
  
  const slides = document.querySelectorAll('.swiper-slide');
  
  if (slides.length > 0) {
    // Set initial state for slides (hidden and scaled down)
    gsap.set(slides, {
      opacity: 0,
      scale: 0.8,
      y: 0
    });
    
    // Animate slides in with stagger (same as modal opening)
    gsap.to(slides, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.2,  // Same stagger timing as modal
      ease: "power2.out",
      delay: 0.1,
      onComplete: () => {
        console.log('✅ Slider entrance animation complete');
      }
    });
    
    // Also animate navigation buttons if they exist
    const navButtons = document.querySelectorAll('.slider-prev, .slider-next');
    if (navButtons.length > 0) {
      gsap.set(navButtons, { opacity: 0, scale: 0.8 });
      gsap.to(navButtons, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.5,
        ease: "back.out(1.7)"
      });
    }
  }
}

// ===== PAGE-SPECIFIC ANIMATIONS =====
function animateHomePage() {
  console.log('🎨 Animating home page elements...');
  
  // Animate logo
  gsap.from('.intro_logo_wrap', {
    scale: 0.8,
    opacity: 0,
    duration: 1,
    ease: "power2.out",
    delay: 0.3
  });
  
  // Animate project items with stagger
  gsap.from('.projects_item', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power2.out",
    delay: 0.5
  });
}

function animateContactPage() {
  console.log('📧 Animating contact page elements...');
  
  // Add contact page specific animations here
  gsap.from('.contact-content', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out",
    delay: 0.3
  });
}

// ===== UTILITY FUNCTIONS =====
window.testTransition = function() {
  console.log('🧪 Testing page transition...');
  
  // Simulate a page transition effect
  gsap.to('.page_wrap', {
    opacity: 0,
    scale: 0.95,
    duration: 0.3,
    ease: "power2.inOut",
    onComplete: function() {
      gsap.to('.page_wrap', {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });
};

window.testAnimation = function() {
  console.log('🧪 Test animation function ready');
  animateHomePage();
};

window.testSliders = function() {
  console.log('🎠 Testing slider initialization...');
  initializeSliders();
};

console.log(`
🧪 Test Commands Available:
- testTransition() - Test page transition
- testAnimation() - Test homepage animations  
- testSliders() - Reinitialize sliders
- GSAP slider now active! 🎯
`);



