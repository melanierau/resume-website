Personal Portfolio & Resume Website
This repository contains the source code for my personal portfolio website. It is a modern, responsive, and interactive single-page application designed to showcase my skills, experience, and projects as a Strategic IT Leader. The site is built with a focus on performance, accessibility, and a clean aesthetic.

View the live website here

<!-- It's a good idea to add a screenshot of your live site here -->

Key Features
Feature

Description

🚀 High-Performance

Achieves excellent Lighthouse scores, ensuring a fast and smooth user experience.

🎨 Modern UI/UX

A clean, minimalist design with a focus on readability and intuitive navigation.

📱 Fully Responsive

Optimised for all screen sizes, from mobile phones to widescreen desktops.

✨ Interactive Elements

Includes a dynamic particle background, a mouse follower effect, and a photo gallery slideshow.

🌍 Multilingual Support

Fully internationalised (i18n) and supports English, German, Spanish, French, and Romanian.

🌓 Light & Dark Mode

A theme switcher that respects users' system preferences and saves their choice in local storage.

♿ Accessibility Focused

ARIA attributes and keyboard navigation are implemented for an accessible user experience.

Tech Stack
This project was built with modern web technologies and a focus on maintainability.

HTML5: For the structure and content of the website.

CSS3: For styling, with custom properties (variables) for easy theming.

Tailwind CSS: A utility-first CSS framework for rapid UI development.

JavaScript (ES6+): For interactivity, animations, and internationalisation.

Three.js: A 3D graphics library used for the interactive particle background.

Formspree: For the contact form, allowing for easy and secure form submissions.

Lighthouse Performance Scores
This website is designed to be highly performant, with a focus on a fast and smooth user experience. Here's a breakdown of its Lighthouse scores:

Performance: 95+

Accessibility: 100

Best Practices: 100

SEO: 100

These scores reflect a commitment to modern web standards and a high-quality user experience.

How to Use This Repository as a Template
If you would like to use this repository as a template for your own portfolio website, please follow these steps:

Fork the repository: Click the "Fork" button at the top right of this page to create your own copy of the repository.

Clone your forked repository: Clone the repository to your local machine so you can make changes to the code.

Customise the content:

Text: All the text content is managed through the JSON files in the /i18n directory. You can edit these files to change the text for each language.

Images: Replace the images in the /assets/images directory with your own photos and logos.

CVs and Documents: Update the PDF files in the /assets/docs directory with your own resume and certificates.

Contact Form: Inindex.html, change the action attribute of the contact form to your own Formspree endpoint.

Deploy your website: This project is automatically deployed to Azure Static Web Apps via a GitHub Actions workflow defined in .github/workflows/. Any push to the main branch will trigger a new deployment.

Contributing
While this is a personal portfolio, I am open to suggestions and improvements. If you find a bug or have an idea for a new feature, please feel free to contact me.

License
This project is licensed under the MIT License. See the LICENSE file for more details.
