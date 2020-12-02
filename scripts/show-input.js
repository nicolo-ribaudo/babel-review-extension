on("toggle", ".js-file-header-dropdown", handleMenuOpen);
on("click", ".brw-view-input-file", handleViewInputFile);

const FIXTURE_PATH = /^(?<dir>packages\/[^/]+\/test\/fixtures\/.*?)\/(output\.(?:js|json|mjs)|options\.json)$/;
const EDIT_URL_RE = /^https:\/\/github.com\/(?<repo>[^/]+\/[^/]+)\/(?<action>edit|blob)\/(?<folder>.*?)\/(?<filename>[a-z]+\.[a-z]+)\?pr=.*$/;

const INPUTS = [
  /* 6582 files */ "input.js",
  /* 842 files */ "input.mjs",
  /* 497 files */ "input.ts",
  /* 5 files */ "input.tsx",
  /* 0 files */ "input.jsx",
];

const EDIT_BTN_QUERY = "[aria-label^='Change this file']";

const buildApiUrl = (repo, folder, file) =>
  `https://raw.githubusercontent.com/${repo}/${folder}/${file}`;

/**
 * @param {Event} event
 */
function handleMenuOpen({ target: $dropdown }) {
  if (!$dropdown.open) return;

  if ($dropdown.querySelector(".brw-view-input-file")) return;

  const { path } = $dropdown.closest("[data-path]").dataset;
  if (!FIXTURE_PATH.test(path)) return;

  /** @type {HTMLButtonElement} */
  const $editBtn = $dropdown.querySelector(EDIT_BTN_QUERY);

  const $viewInputBtn = document.createElement("button");
  $viewInputBtn.className = "pl-5 dropdown-item btn-link brw-view-input-file";
  $viewInputBtn.style.whiteSpace = "pre-wrap";
  $viewInputBtn.role = "menuitem";
  $viewInputBtn.type = "button";

  $viewInputBtn.appendChild(document.createTextNode("View input file"));

  $editBtn.before($viewInputBtn);
}

/**
 * @param {Event} event
 */
async function handleViewInputFile(event) {
  event.stopPropagation();
  event.preventDefault();

  const $stickyView = ensureStickyView();
  $stickyView.textContent = "Loading ...";

  /** @type {HTMLButtonElement} */
  const $viewInputBtn = event.target;
  /** @type {HTMLAnchorElement} */
  const $editBtn = $viewInputBtn.parentElement.querySelector(EDIT_BTN_QUERY);

  let inputFile;

  const match = $editBtn.href.match(EDIT_URL_RE);
  if (match) {
    /** @type {{ repo: string, folder: string }} */
    const { repo, folder } = match.groups;

    for (const inputName of INPUTS) {
      const url = buildApiUrl(repo, folder, inputName);

      try {
        const result = await fetch(url);
        if (result.status === 200) {
          $stickyView.textContent = await result.text();
          return;
        }
      } catch {}
    }
  }

  $stickyView.textContent = `Failed to load input file`;
}

function ensureStickyView() {
  /** @type {HTMLDivElement} */
  let $stickyView = document.querySelector("#brw-sticky-view");
  if ($stickyView) {
    $stickyView.style.display = "block";
    return $stickyView.querySelector("#brw-sticky-view-contents");
  }

  $stickyView = document.createElement("div");
  $stickyView.id = "brw-sticky-view";
  $stickyView.style.position = "sticky";
  $stickyView.style.zIndex = "29";
  $stickyView.style.bottom = "0px";
  $stickyView.style.height = "40vh";
  $stickyView.style.width = "100%";
  $stickyView.style.overflowY = "auto";
  $stickyView.style.resize = "vertical";
  $stickyView.style.padding = "20px";
  $stickyView.style.backgroundColor = "var(--color-bg-primary)";
  $stickyView.style.boxShadow = "0px 15px 20px 0px black";

  const $stickyViewContents = document.createElement("pre");
  $stickyViewContents.id = "brw-sticky-view-contents";
  $stickyView.appendChild($stickyViewContents);

  const $stickyViewClose = document.createElement("button");
  $stickyViewClose.textContent = "Close";
  $stickyViewClose.style.position = "absolute";
  $stickyViewClose.style.top = "10px";
  $stickyViewClose.style.right = "10px";
  $stickyViewClose.addEventListener("click", () => {
    $stickyView.style.display = "none";
  });
  $stickyView.appendChild($stickyViewClose);

  document.body.appendChild($stickyView);

  return $stickyViewContents;
}

/**
 * @param {string} event
 * @param {string} target
 * @param {(event: Event) => unknown} handler
 */
function on(event, target, handler) {
  document.addEventListener(
    event,
    (e) => {
      if (e.target.matches(target)) handler(e);
    },
    { capture: true }
  );
}
