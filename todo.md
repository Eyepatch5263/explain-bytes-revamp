# Coral Accent Revision

- [x] Replace the bright lime with a deep coral accent in shared color tokens and homepage elements.
- [x] Rebalance accent contrast for dark panels, interactive controls, and focus states.
- [x] Verify the coral revision at desktop and mobile breakpoints.

# Coral Illustration and Hover Revision

- [x] Regenerate the primary learning illustrations using the coral accent system.
- [x] Update illustration references in the homepage.
- [x] Add restrained hover motion to active learning cards and verify the responsive presentation.

# Coral-Aware Dark Mode

- [x] Add the low-light coral theme tokens and readable dark-surface variants.
- [x] Add a persistent, accessible theme toggle to the site header.
- [x] Verify the dark theme at desktop and mobile breakpoints.

# Dark-Mode Mobile Navigation Fix

- [x] Apply a dark menu surface and high-contrast navigation states on mobile.
- [x] Verify the expanded mobile menu while dark mode is active.

# Repository-Backed Flashcard Section

- [x] Locate and understand the existing flashcard questions and answers in the repository.
- [x] Build the full homepage flashcard experience from the existing content.
- [x] Verify flashcard navigation, answer reveal, and responsive presentation.

# Flashcard Route Separation

- [x] Move the full interactive System Design deck to a dedicated flashcards route.
- [x] Replace the homepage deck with a concise flashcard feature showcase and route CTA.
- [x] Verify the standalone route, route links, and mobile layouts.

# Additional Flashcard Decks

- [x] Retrieve the existing Operating Systems, Networking, and DBMS question-and-answer data.
- [x] Add a shared deck selector and reusable routes for the three new study decks.
- [x] Validate each new deck’s content, interaction, and responsive layout.

# System Design Flash Docs

- [x] Preserve every existing System Design MDX chapter and topic order from the source repository.
- [x] Configure the reader to render the MDX prose, diagrams, code blocks, tables, and callouts without trimming content.
- [x] Port the existing DNS, database, and load-balancing simulations into the dedicated reader routes.
- [x] Scaffold the Amazon Polly and S3 chapter-listening flow with user-supplied environment variables, ready for later credential activation.
- [x] Verify chapter rendering, simulations, listening controls, and responsive reader navigation.

# Flash Docs Fidelity Refinements

- [x] Use the original System Design topic metadata and source category order in the reader catalogue and chapter navigation.
- [x] Convert source MDX note, tip, warning, and caution alerts into readable Flash Docs callouts.
- [x] Verify the library, chapter reader, and DNS simulation at the mobile breakpoint.

# Wide-Screen Flash Docs Reader

- [x] Expand the desktop article column to use large screens more effectively while preserving the chapter and outline rails.
- [x] Verify the expanded reader at desktop and retain the current mobile reading width.

# Wide-Screen Reader Mobile Regression Check

- [x] Confirm the mobile reader remains unchanged below the desktop-only 1280px layout breakpoint.

# Desktop Article Content Fill Correction

- [x] Remove the remaining desktop prose and heading width caps so chapter content visibly fills the central reader pane.
- [x] Verify the corrected full-width desktop content presentation.

# Full-Width Desktop Verification

- [x] Confirm at 1600px desktop width that the article heading, prose, tables, diagrams, and simulations span the full available middle pane between the navigation rails.

# Unified System Design Simulations

- [x] Audit the DNS, database, and load-balancing simulation visuals and controls for design-system mismatches.
- [x] Add a shared coral-aware Flash Docs simulation shell and theme-consistent controls.
- [x] Verify all simulation routes retain their interactions and match the reader at desktop and mobile sizes.

# Polished Loading States

- [x] Audit high-visibility asynchronous and lazy-loaded experiences for missing or generic loading feedback.
- [x] Add reusable coral-aware skeletons with accessible loading labels and reduced-motion support.
- [x] Apply contextual loading states to the Flash Docs reader, simulations, and chapter audio.
- [x] Add tests and verify loading states in light, dark, desktop, and mobile presentations.
- [x] Capture the shared skeleton in light and dark themes at desktop and mobile breakpoints.
- [x] Verify the chapter-audio pending control remains readable and announces its state in both themes.
