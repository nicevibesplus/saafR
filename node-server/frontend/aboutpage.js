window.renderPage = function () {
  document.getElementById("content").innerHTML = `
      <div class="container my-5">
        <div class="row justify-content-center">
          <div class="col-lg-10 col-xl-8">
            
            <div class="mb-5">
              <h1 class="display-4 mb-4" style="color: #212529;">About Us</h1>
              
              <div class="card mb-4 shadow-sm">
                <div class="card-body">
                  <h2 class="card-title h4" style="color: #212529;">What We Do</h2>
                  <p class="card-text">
                    We created this application to help users navigate safely across Münster. This includes accidents and anxiety zones to give every user a safe and satisfactory navigation option. Our platform combines innovative features with an intuitive design to provide the best user experience for navigation tasks.
                  </p>
                </div>
              </div>

              <div class="card mb-4 shadow-sm">
                <div class="card-body">
                  <h2 class="card-title h4" style="color: #212529;">Our Team</h2>
                  <p class="card-text">
                    We are a team of five passionate developers who came together to build this project:
                  </p>
                  <ul class="list-group list-group-flush mt-3" style="list-style: none; padding-left: 0;">
                      <li><strong>Florian Thiemann</strong> - CEO</li>
                      <li><strong>Andreas Rademaker</strong> - CTO</li>
                      <li><strong>Lea Heming</strong> - Frontend Developer</li>
                      <li><strong>Emil Erlenkötter</strong> - UI/UX Designer</li>
                      <li><strong>Jan Becker</strong> - CDO</li>

                  </ul>
                </div>
              </div>

              <div class="card mb-4 shadow-sm">
                <div class="card-body">
                  <h2 class="card-title h4" style="color: #212529;">Our Mission</h2>
                  <p class="card-text">
                    Our mission is to create user-friendly tools that make everyday life easier and safer. We believe in open collaboration and continuous improvement.
                  </p>
                </div>
              </div>
            </div>

            <hr class="my-5">

            <div class="mb-5">
              <h2 class="h4 mb-4">Legal Information</h2>
              
              <div class="mb-4">
                <h2 class="h5" style="color: #212529;">Information pursuant to § 5 DDG</h2>
                <p class="text-muted">
                  saafR<br>
                  Heisenbergstraße 2<br>
                  48149 Münster<br>
                  Germany
                </p>
              </div>

              <div class="mb-4">
                <h2 class="h5" style="color: #212529;">Contact</h2>
                <p class="text-muted">
                  If there are any problems with the app or you want to learn more, feel free to contact us via our project manager. You can reach us here: <br>
                  Email: <a href="mailto:[fthieman@uni-muenster.de]">Florian Thiemann</a>
                </p>
              </div>

              <div class="mb-4">
                <h2 class="h5" style="color: #212529;">Responsible for Content</h2>
                <p class="text-muted">
                  saafR<br>
                  safe, accident and anxiety free routing
                </p>
              </div>

              <div class="mb-4">
                <h2 class="h5" style="color: #212529;">Disclaimer</h2>
                <h3 class="h6 mt-3">Liability for Content</h3>
                <p class="text-muted">
                  The content of our pages has been created with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with general laws.
                </p>
              </div>

              <div class="mb-4">
                <h2 class="h5" style="color: #212529;">Copyright</h2>
                <p class="text-muted">
                  The content and works created by the site operators on these pages are subject to copyright law under GNU General Public License v3.0. Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

  const contentElement = document.getElementById("content");
  contentElement.style.overflow = "auto";
  contentElement.style.height = "auto";
  contentElement.style.maxHeight = "none";
};

//function to reset style
window.unmountPage = function () {
  const contentElement = document.getElementById("content");
  if (contentElement) {
    contentElement.style.overflow = "";
    contentElement.style.height = "";
    contentElement.style.maxHeight = "";
  }
};