import { auth, db } from "./firebase-config.js";

import {
  EmailAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   GENERAL HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const $$ = (selector) => [
  ...document.querySelectorAll(selector)
];

const escapeHtml = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
};

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
};

let editor = null;


/* =========================================================
   DEFAULT CONTENT
========================================================= */

const defaults = {
  home: {
    heroTitle: "Adventure starts here.",
    heroSubtitle:
      "Helping young people build confidence, friendships and skills through meaningful adventures.",
    heroButton: "Explore our sections",
    aboutTitle: "Scouting in Sault Ste. Marie",
    aboutText:
      "The 1st Sault Ste. Marie Scout Group provides youth with opportunities to learn, lead, serve and explore in a welcoming environment."
  },

  apple: {
    title: "Apple Day",
    description:
      "Apple Day is a long-standing Scouting tradition that helps fund local programming, equipment and camps.",
    date: "To be announced",
    location: "Sault Ste. Marie",
    donationUrl: "",
    amountRaised: 0,
    goal: 5000
  },

  settings: {
    groupName: "1st Sault Ste. Marie Scout Group",
    publicEmail: "",
    phone: "",
    meetingLocation: "Sault Ste. Marie, Ontario",
    city: "Sault Ste. Marie",
    province: "Ontario"
  }
};


/* =========================================================
   FIREBASE AUTH PERSISTENCE
========================================================= */

try {
  await setPersistence(auth, browserLocalPersistence);
} catch (error) {
  console.error("Unable to configure authentication persistence:", error);
}


/* =========================================================
   USER MESSAGES AND ERROR HANDLING
========================================================= */

function showAdminMessage(text, type = "success") {
  const messageElement = $("adminMessage");

  if (!messageElement) {
    console.warn("Admin message element was not found:", text);
    return;
  }

  messageElement.textContent = text;
  messageElement.className = `admin-message ${type}`;

  window.setTimeout(() => {
    if (messageElement.textContent === text) {
      messageElement.textContent = "";
      messageElement.className = "admin-message";
    }
  }, 5000);
}

function getErrorMessage(error) {
  const knownErrors = {
    "auth/invalid-credential":
      "The email address or password is incorrect.",

    "auth/invalid-email":
      "Enter a valid email address.",

    "auth/too-many-requests":
      "Too many attempts have been made. Try again later.",

    "auth/network-request-failed":
      "A network error occurred. Check your internet connection.",

    "permission-denied":
      "Firebase denied access to the requested information.",

    "failed-precondition":
      "Firebase requires an additional database index for this request."
  };

  return (
    knownErrors[error?.code] ||
    error?.message ||
    "An unexpected error occurred."
  );
}

function setLoginMessage(text) {
  const loginMessage = $("loginMessage");

  if (loginMessage) {
    loginMessage.textContent = text;
  }
}


/* =========================================================
   FIRESTORE HELPERS
========================================================= */

async function readDocument(
  collectionName,
  documentId,
  fallback
) {
  const snapshot = await getDoc(
    doc(db, collectionName, documentId)
  );

  return snapshot.exists()
    ? {
        ...fallback,
        ...snapshot.data()
      }
    : fallback;
}

async function logActivity(action, target) {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    await addDoc(collection(db, "activityLog"), {
      action,
      target,
      userUid: currentUser.uid,
      userEmail: currentUser.email,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Activity log could not be written:", error);
  }
}


/* =========================================================
   LOGIN
========================================================= */

const loginForm = $("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    setLoginMessage("");

    const emailInput = $("loginEmail");
    const passwordInput = $("loginPassword");

    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      setLoginMessage(
        "Enter both your email address and password."
      );
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (error) {
      console.error("Sign-in failed:", error);
      setLoginMessage(getErrorMessage(error));
    }
  });
}


/* =========================================================
   PASSWORD RESET
========================================================= */

const forgotButton = $("forgotBtn");

if (forgotButton) {
  forgotButton.addEventListener("click", async () => {
    const email = $("loginEmail")?.value.trim() || "";

    if (!email) {
      setLoginMessage(
        "Enter your email address first."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.warn("Password reset request:", error);
    }

    setLoginMessage(
      "If the account exists, password reset instructions have been sent."
    );
  });
}


/* =========================================================
   SIGN OUT
========================================================= */

const signOutButton = $("signOutBtn");

if (signOutButton) {
  signOutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failed:", error);
      showAdminMessage(
        getErrorMessage(error),
        "error"
      );
    }
  });
}


/* =========================================================
   AUTHORIZATION AND DASHBOARD STARTUP
========================================================= */

function showLoginView() {
  const dashboardView = $("dashboardView");
  const loginView = $("loginView");

  if (dashboardView) {
    dashboardView.hidden = true;
  }

  if (loginView) {
    loginView.hidden = false;
  }
}

function showDashboardView() {
  const dashboardView = $("dashboardView");
  const loginView = $("loginView");

  if (loginView) {
    loginView.hidden = true;
  }

  if (dashboardView) {
    dashboardView.hidden = false;
  }
}

onAuthStateChanged(auth, async (user) => {
  console.log("Authentication state changed:", {
    signedIn: Boolean(user),
    uid: user?.uid || null,
    email: user?.email || null
  });

  if (!user) {
    showLoginView();
    return;
  }

  setLoginMessage("Checking account authorization…");

  let profile;

  /*
   * Authentication and authorization are checked separately
   * from dashboard loading.
   *
   * A dashboard content error must not sign the user out.
   */
  try {
    const userDocumentReference = doc(
      db,
      "users",
      user.uid
    );

    const userSnapshot = await getDoc(
      userDocumentReference
    );

    console.log("User profile document:", {
      path: `users/${user.uid}`,
      exists: userSnapshot.exists()
    });

    if (!userSnapshot.exists()) {
      setLoginMessage(
        `No administrator profile exists for this account. UID: ${user.uid}`
      );

      await signOut(auth);
      return;
    }

    profile = userSnapshot.data();

    console.log("Administrator profile:", profile);

    const validRoles = [
      "owner",
      "administrator",
      "editor"
    ];

    if (profile.active !== true) {
      setLoginMessage(
        "This administrator account is inactive."
      );

      await signOut(auth);
      return;
    }

    if (!validRoles.includes(profile.role)) {
      setLoginMessage(
        `This account has an unsupported role: ${profile.role || "none"}.`
      );

      await signOut(auth);
      return;
    }
  } catch (error) {
    /*
     * This usually indicates that Firestore rules prevented
     * the signed-in user from reading users/{uid}.
     */
    console.error(
      "Administrator authorization check failed:",
      error
    );

    showLoginView();

    setLoginMessage(
      `The account signed in, but its administrator profile could not be read. ${getErrorMessage(error)}`
    );

    /*
     * Do not automatically sign out here.
     * Keeping the session active makes the real Firestore
     * error visible instead of causing a login loop.
     */
    return;
  }

  showDashboardView();
  setLoginMessage("");

  const roleText = $("roleText");

  if (roleText) {
    roleText.textContent = profile.role;
  }

  const signedInName = $("signedInName");

  if (signedInName) {
    signedInName.textContent =
      profile.displayName ||
      user.displayName ||
      user.email ||
      "Administrator";
  }

  /*
   * This is deliberately outside the authorization try/catch.
   * Loading errors now display on the dashboard instead of
   * signing the administrator out.
   */
  try {
    await loadAll();
  } catch (error) {
    console.error(
      "Administrator dashboard failed to load:",
      error
    );

    showAdminMessage(
      `You are signed in, but some administrator settings could not be loaded. ${getErrorMessage(error)}`,
      "error"
    );
  }
});


/* =========================================================
   DASHBOARD NAVIGATION
========================================================= */

$$(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".nav-item").forEach((item) => {
      item.classList.toggle(
        "active",
        item === button
      );
    });

    $$(".panel").forEach((panel) => {
      panel.classList.toggle(
        "active",
        panel.dataset.panelContent ===
          button.dataset.panel
      );
    });

    const panelTitle = $("panelTitle");

    if (panelTitle) {
      panelTitle.textContent =
        button.textContent.trim();
    }
  });
});


/* =========================================================
   LOAD ALL DASHBOARD CONTENT
========================================================= */

async function loadAll() {
  const loaders = [
    {
      name: "homepage",
      function: loadHome
    },
    {
      name: "Apple Day",
      function: loadApple
    },
    {
      name: "general settings",
      function: loadSettings
    },
    {
      name: "sections",
      function: loadSections
    },
    {
      name: "announcements",
      function: loadAnnouncements
    },
    {
      name: "events",
      function: loadEvents
    }
  ];

  const results = await Promise.allSettled(
    loaders.map((loader) => loader.function())
  );

  const failures = [];

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const loaderName = loaders[index].name;

      failures.push(loaderName);

      console.error(
        `Unable to load ${loaderName}:`,
        result.reason
      );
    }
  });

  if (failures.length) {
    showAdminMessage(
      `You are signed in, but these areas could not be loaded: ${failures.join(", ")}. Check the browser console and Firestore rules.`,
      "error"
    );
  }
}


/* =========================================================
   HOMEPAGE SETTINGS
========================================================= */

async function loadHome() {
  const home = await readDocument(
    "siteContent",
    "homepage",
    defaults.home
  );

  $("homeHeroTitle").value =
    home.heroTitle || "";

  $("homeHeroSubtitle").value =
    home.heroSubtitle || "";

  $("homeHeroButton").value =
    home.heroButton || "";

  $("homeAboutTitle").value =
    home.aboutTitle || "";

  $("homeAboutText").value =
    home.aboutText || "";
}

const homepageForm = $("homepageForm");

if (homepageForm) {
  homepageForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      try {
        await setDoc(
          doc(db, "siteContent", "homepage"),
          {
            heroTitle:
              $("homeHeroTitle").value.trim(),

            heroSubtitle:
              $("homeHeroSubtitle").value.trim(),

            heroButton:
              $("homeHeroButton").value.trim(),

            aboutTitle:
              $("homeAboutTitle").value.trim(),

            aboutText:
              $("homeAboutText").value.trim(),

            updatedAt: serverTimestamp()
          },
          {
            merge: true
          }
        );

        await logActivity(
          "updated",
          "siteContent/homepage"
        );

        showAdminMessage(
          "Homepage saved."
        );
      } catch (error) {
        console.error(
          "Homepage save failed:",
          error
        );

        showAdminMessage(
          getErrorMessage(error),
          "error"
        );
      }
    }
  );
}


/* =========================================================
   APPLE DAY SETTINGS
========================================================= */

async function loadApple() {
  const apple = await readDocument(
    "siteContent",
    "appleDay",
    defaults.apple
  );

  $("appleAdminTitle").value =
    apple.title || "";

  $("appleAdminDate").value =
    apple.date || "";

  $("appleAdminLocation").value =
    apple.location || "";

  $("appleAdminUrl").value =
    apple.donationUrl || "";

  $("appleAdminRaised").value =
    Number(apple.amountRaised) || 0;

  $("appleAdminGoal").value =
    Number(apple.goal) || 5000;

  $("appleAdminDescription").value =
    apple.description || "";

  $("statRaised").textContent =
    formatMoney(apple.amountRaised);
}

const appleForm = $("appleForm");

if (appleForm) {
  appleForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      try {
        await setDoc(
          doc(db, "siteContent", "appleDay"),
          {
            title:
              $("appleAdminTitle").value.trim(),

            date:
              $("appleAdminDate").value.trim(),

            location:
              $("appleAdminLocation").value.trim(),

            donationUrl:
              $("appleAdminUrl").value.trim(),

            amountRaised:
              Number(
                $("appleAdminRaised").value
              ) || 0,

            goal: Math.max(
              1,
              Number(
                $("appleAdminGoal").value
              ) || 1
            ),

            description:
              $("appleAdminDescription").value.trim(),

            updatedAt: serverTimestamp()
          },
          {
            merge: true
          }
        );

        await logActivity(
          "updated",
          "siteContent/appleDay"
        );

        await loadApple();

        showAdminMessage(
          "Apple Day details saved."
        );
      } catch (error) {
        console.error(
          "Apple Day save failed:",
          error
        );

        showAdminMessage(
          getErrorMessage(error),
          "error"
        );
      }
    }
  );
}


/* =========================================================
   GENERAL SETTINGS
========================================================= */

async function loadSettings() {
  const settings = await readDocument(
    "settings",
    "general",
    defaults.settings
  );

  $("settingsGroupName").value =
    settings.groupName || "";

  $("settingsEmail").value =
    settings.publicEmail || "";

  $("settingsPhone").value =
    settings.phone || "";

  $("settingsLocation").value =
    settings.meetingLocation || "";

  $("settingsCity").value =
    settings.city || "";

  $("settingsProvince").value =
    settings.province || "";
}

const settingsForm = $("settingsForm");

if (settingsForm) {
  settingsForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      try {
        await setDoc(
          doc(db, "settings", "general"),
          {
            groupName:
              $("settingsGroupName").value.trim(),

            publicEmail:
              $("settingsEmail").value.trim(),

            phone:
              $("settingsPhone").value.trim(),

            meetingLocation:
              $("settingsLocation").value.trim(),

            city:
              $("settingsCity").value.trim(),

            province:
              $("settingsProvince").value.trim(),

            updatedAt: serverTimestamp()
          },
          {
            merge: true
          }
        );

        await logActivity(
          "updated",
          "settings/general"
        );

        showAdminMessage(
          "Settings saved."
        );
      } catch (error) {
        console.error(
          "Settings save failed:",
          error
        );

        showAdminMessage(
          getErrorMessage(error),
          "error"
        );
      }
    }
  );
}


/* =========================================================
   SECTIONS
========================================================= */

async function loadSections() {
  const snapshot = await getDocs(
    query(
      collection(db, "sections"),
      orderBy("order", "asc")
    )
  );

  const items = snapshot.docs.map(
    (documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
    })
  );

  const visibleSections = items.filter(
    (item) => item.active !== false
  );

  $("statSections").textContent =
    visibleSections.length;

  $("sectionsList").innerHTML =
    items.length
      ? items
          .map((item) => {
            return `
              <div class="editor-row">
                <div>
                  <h3>
                    ${escapeHtml(
                      item.displayName ||
                      item.name ||
                      item.id
                    )}
                  </h3>

                  <p>
                    ${escapeHtml(item.ageRange || "")}
                    ·
                    ${
                      item.active === false
                        ? "Hidden"
                        : "Visible"
                    }
                  </p>
                </div>

                <button
                  class="button button-small button-secondary edit-section"
                  type="button"
                  data-id="${escapeHtml(item.id)}"
                >
                  Edit
                </button>
              </div>
            `;
          })
          .join("")
      : "<p>No sections found.</p>";

  $$(".edit-section").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedSection = items.find(
        (item) =>
          item.id === button.dataset.id
      );

      if (selectedSection) {
        openSection(selectedSection);
      }
    });
  });
}

function openSection(section) {
  editor = {
    type: "section",
    id: section.id
  };

  $("dialogTitle").textContent =
    `Edit ${
      section.displayName ||
      section.id
    }`;

  $("dialogFields").innerHTML = `
    <label>
      Display name

      <input
        name="displayName"
        value="${escapeHtml(
          section.displayName ||
          section.name ||
          ""
        )}"
        required
      >
    </label>

    <label>
      Age range

      <input
        name="ageRange"
        value="${escapeHtml(
          section.ageRange || ""
        )}"
      >
    </label>

    <label>
      Description

      <textarea
        name="description"
        rows="4"
      >${escapeHtml(
        section.description || ""
      )}</textarea>
    </label>

    <label>
      Order

      <input
        name="order"
        type="number"
        step="1"
        value="${Number(section.order) || 0}"
      >
    </label>

    <label>
      Slug

      <input
        name="slug"
        value="${escapeHtml(
          section.slug ||
          section.id
        )}"
      >
    </label>

    <label>
      <span>
        <input
          name="active"
          type="checkbox"
          ${
            section.active !== false
              ? "checked"
              : ""
          }
        >

        Visible on website
      </span>
    </label>
  `;

  $("editorDialog").showModal();
}


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

async function loadAnnouncements() {
  const snapshot = await getDocs(
    query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    )
  );

  const items = snapshot.docs.map(
    (documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
    })
  );

  $("statAnnouncements").textContent =
    items.filter((item) => item.published).length;

  $("announcementsList").innerHTML =
    items.length
      ? items
          .map((item) =>
            createEditorRow(
              item,
              "announcement"
            )
          )
          .join("")
      : "<p>No announcements found.</p>";

  bindEditorRows(
    items,
    "announcement"
  );
}


/* =========================================================
   EVENTS
========================================================= */

async function loadEvents() {
  const snapshot = await getDocs(
    query(
      collection(db, "events"),
      orderBy("start", "asc")
    )
  );

  const items = snapshot.docs.map(
    (documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
    })
  );

  $("statEvents").textContent =
    items.filter((item) => item.published).length;

  $("eventsList").innerHTML =
    items.length
      ? items
          .map((item) =>
            createEditorRow(
              item,
              "event"
            )
          )
          .join("")
      : "<p>No events found.</p>";

  bindEditorRows(
    items,
    "event"
  );
}


/* =========================================================
   EVENT AND ANNOUNCEMENT ROWS
========================================================= */

function createEditorRow(item, type) {
  const secondaryText =
    type === "event"
      ? item.location || "No location"
      : (item.content || "").slice(0, 100);

  return `
    <div class="editor-row">
      <div>
        <h3>
          ${escapeHtml(
            item.title ||
            "Untitled"
          )}
        </h3>

        <p>
          ${
            item.published
              ? "Published"
              : "Draft"
          }
          ·
          ${escapeHtml(secondaryText)}
        </p>
      </div>

      <div class="row-actions">
        <button
          class="button button-small button-secondary edit-${type}"
          type="button"
          data-id="${escapeHtml(item.id)}"
        >
          Edit
        </button>

        <button
          class="danger delete-${type}"
          type="button"
          data-id="${escapeHtml(item.id)}"
        >
          Delete
        </button>
      </div>
    </div>
  `;
}

function bindEditorRows(items, type) {
  $$(`.edit-${type}`).forEach((button) => {
    button.addEventListener("click", () => {
      const selectedItem = items.find(
        (item) =>
          item.id === button.dataset.id
      );

      if (!selectedItem) {
        return;
      }

      if (type === "event") {
        openEvent(selectedItem);
      } else {
        openAnnouncement(selectedItem);
      }
    });
  });

  $$(`.delete-${type}`).forEach((button) => {
    button.addEventListener("click", () => {
      const collectionName =
        type === "event"
          ? "events"
          : "announcements";

      const reloadFunction =
        type === "event"
          ? loadEvents
          : loadAnnouncements;

      removeItem(
        collectionName,
        button.dataset.id,
        reloadFunction
      );
    });
  });
}


/* =========================================================
   NEW ITEM BUTTONS
========================================================= */

const newAnnouncementButton =
  $("newAnnouncement");

if (newAnnouncementButton) {
  newAnnouncementButton.addEventListener(
    "click",
    () => {
      openAnnouncement({
        published: true
      });
    }
  );
}

const newEventButton = $("newEvent");

if (newEventButton) {
  newEventButton.addEventListener(
    "click",
    () => {
      openEvent({
        published: true
      });
    }
  );
}


/* =========================================================
   ANNOUNCEMENT EDITOR
========================================================= */

function openAnnouncement(announcement) {
  editor = {
    type: "announcement",
    id: announcement.id || null
  };

  $("dialogTitle").textContent =
    announcement.id
      ? "Edit announcement"
      : "New announcement";

  $("dialogFields").innerHTML = `
    <label>
      Title

      <input
        name="title"
        value="${escapeHtml(
          announcement.title || ""
        )}"
        required
      >
    </label>

    <label>
      Content

      <textarea
        name="content"
        rows="5"
        required
      >${escapeHtml(
        announcement.content || ""
      )}</textarea>
    </label>

    <label>
      <span>
        <input
          name="published"
          type="checkbox"
          ${
            announcement.published !== false
              ? "checked"
              : ""
          }
        >

        Published
      </span>
    </label>
  `;

  $("editorDialog").showModal();
}


/* =========================================================
   EVENT EDITOR
========================================================= */

function dateToInputValue(value) {
  const date = value?.toDate
    ? value.toDate()
    : value
      ? new Date(value)
      : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const adjustedDate = new Date(
    date.getTime() -
    date.getTimezoneOffset() * 60000
  );

  return adjustedDate
    .toISOString()
    .slice(0, 16);
}

function openEvent(eventItem) {
  editor = {
    type: "event",
    id: eventItem.id || null
  };

  $("dialogTitle").textContent =
    eventItem.id
      ? "Edit event"
      : "New event";

  $("dialogFields").innerHTML = `
    <label>
      Title

      <input
        name="title"
        value="${escapeHtml(
          eventItem.title || ""
        )}"
        required
      >
    </label>

    <label>
      Location

      <input
        name="location"
        value="${escapeHtml(
          eventItem.location || ""
        )}"
      >
    </label>

    <label>
      Start

      <input
        name="start"
        type="datetime-local"
        value="${dateToInputValue(
          eventItem.start
        )}"
        required
      >
    </label>

    <label>
      End

      <input
        name="end"
        type="datetime-local"
        value="${dateToInputValue(
          eventItem.end
        )}"
      >
    </label>

    <label>
      Description

      <textarea
        name="description"
        rows="4"
      >${escapeHtml(
        eventItem.description || ""
      )}</textarea>
    </label>

    <label>
      <span>
        <input
          name="published"
          type="checkbox"
          ${
            eventItem.published !== false
              ? "checked"
              : ""
          }
        >

        Published
      </span>
    </label>
  `;

  $("editorDialog").showModal();
}


/* =========================================================
   SAVE EDITOR DIALOG
========================================================= */

const editorForm = $("editorForm");

if (editorForm) {
  editorForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (
        event.submitter?.value === "cancel" ||
        !editor
      ) {
        return;
      }

      const formData = new FormData(
        event.currentTarget
      );

      try {
        if (editor.type === "section") {
          await updateDoc(
            doc(
              db,
              "sections",
              editor.id
            ),
            {
              displayName: String(
                formData.get("displayName")
              ).trim(),

              ageRange: String(
                formData.get("ageRange")
              ).trim(),

              description: String(
                formData.get("description")
              ).trim(),

              order:
                Number(
                  formData.get("order")
                ) || 0,

              slug: String(
                formData.get("slug")
              ).trim(),

              active:
                formData.get("active") === "on",

              updatedAt: serverTimestamp()
            }
          );

          await loadSections();
        } else if (
          editor.type === "announcement"
        ) {
          const announcementData = {
            title: String(
              formData.get("title")
            ).trim(),

            content: String(
              formData.get("content")
            ).trim(),

            published:
              formData.get("published") === "on",

            updatedAt: serverTimestamp()
          };

          if (editor.id) {
            await updateDoc(
              doc(
                db,
                "announcements",
                editor.id
              ),
              announcementData
            );
          } else {
            await addDoc(
              collection(db, "announcements"),
              {
                ...announcementData,
                createdAt: serverTimestamp()
              }
            );
          }

          await loadAnnouncements();
        } else if (
          editor.type === "event"
        ) {
          const startValue = String(
            formData.get("start")
          );

          const endValue = String(
            formData.get("end")
          );

          const startDate = new Date(
            startValue
          );

          const endDate = endValue
            ? new Date(endValue)
            : startDate;

          if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
          ) {
            throw new Error(
              "Enter a valid event date and time."
            );
          }

          const eventData = {
            title: String(
              formData.get("title")
            ).trim(),

            location: String(
              formData.get("location")
            ).trim(),

            description: String(
              formData.get("description")
            ).trim(),

            start:
              Timestamp.fromDate(startDate),

            end:
              Timestamp.fromDate(endDate),

            published:
              formData.get("published") === "on",

            updatedAt: serverTimestamp()
          };

          if (editor.id) {
            await updateDoc(
              doc(
                db,
                "events",
                editor.id
              ),
              eventData
            );
          } else {
            await addDoc(
              collection(db, "events"),
              {
                ...eventData,
                createdAt: serverTimestamp()
              }
            );
          }

          await loadEvents();
        }

        await logActivity(
          editor.id
            ? "updated"
            : "created",
          editor.type
        );

        $("editorDialog").close();

        showAdminMessage(
          "Changes saved."
        );
      } catch (error) {
        console.error(
          "Editor save failed:",
          error
        );

        showAdminMessage(
          getErrorMessage(error),
          "error"
        );
      }
    }
  );
}


/* =========================================================
   DELETE ITEMS
========================================================= */

async function removeItem(
  collectionName,
  documentId,
  reloadFunction
) {
  const confirmed = window.confirm(
    "Delete this item permanently?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteDoc(
      doc(
        db,
        collectionName,
        documentId
      )
    );

    await logActivity(
      "deleted",
      `${collectionName}/${documentId}`
    );

    await reloadFunction();

    showAdminMessage(
      "Item deleted."
    );
  } catch (error) {
    console.error(
      "Delete failed:",
      error
    );

    showAdminMessage(
      getErrorMessage(error),
      "error"
    );
  }
}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

const passwordForm = $("passwordForm");

if (passwordForm) {
  passwordForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const currentPassword =
        $("currentPassword").value;

      const newPassword =
        $("newPassword").value;

      const confirmPassword =
        $("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        showAdminMessage(
          "The new passwords do not match.",
          "error"
        );

        return;
      }

      try {
        const currentUser = auth.currentUser;

        if (!currentUser?.email) {
          throw new Error(
            "No signed-in account was found."
          );
        }

        const credential =
          EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
          );

        await reauthenticateWithCredential(
          currentUser,
          credential
        );

        await updatePassword(
          currentUser,
          newPassword
        );

        event.currentTarget.reset();

        showAdminMessage(
          "Password changed successfully."
        );
      } catch (error) {
        console.error(
          "Password change failed:",
          error
        );

        showAdminMessage(
          getErrorMessage(error),
          "error"
        );
      }
    }
  );
}
