const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const generatedCvs = new Map();

function toList(input, fallback) {
  const values = (input || "")
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);

  return values.length ? values : fallback;
}

function buildCvFromInput({
  fullName,
  email,
  phone,
  location,
  linkedIn,
  gitHubUsername,
  stackOverflowUserId,
  focusRole,
  yearsExperience,
  highlights,
  topSkills
}) {
  const safeRole = focusRole || "Software Engineer";
  const safeYears = yearsExperience || "3+";

  const skills = toList(topSkills, [
    "JavaScript",
    "Node.js",
    "REST APIs",
    "System Design",
    "Problem Solving",
    "Testing"
  ]);

  const achievements = toList(highlights, [
    "Improved API response times by optimizing route-level data flow.",
    "Delivered production features with clear ownership and release discipline.",
    "Reduced bug regression through stronger validation and testing practices."
  ]);

  const projects = [
    {
      name: `${gitHubUsername || "candidate"}-portfolio`,
      impact: "Built full-stack features and automated deployment workflow.",
      tech: ["Node.js", "Express", "Cloud Run"]
    },
    {
      name: "profile-signals-engine",
      impact: "Extracted profile insights and transformed them into recruiter-focused narrative.",
      tech: ["JavaScript", "Data Processing", "Prompt Engineering"]
    },
    {
      name: "cv-export-service",
      impact: "Implemented JSON and PDF output pipeline keyed by cvId.",
      tech: ["Express", "PDFKit", "API Design"]
    }
  ];

  return {
    candidate: {
      fullName: fullName || "Candidate Name",
      title: safeRole,
      yearsExperience: safeYears,
      email: email || null,
      phone: phone || null,
      location: location || null,
      linkedIn: linkedIn || null,
      gitHubUsername: gitHubUsername || null,
      stackOverflowUserId: stackOverflowUserId || null
    },
    summary:
      `Results-driven ${safeRole} with ${safeYears} years of hands-on delivery across backend services and product features. ` +
      "Known for turning ambiguous requirements into reliable, measurable outcomes.",
    skills,
    projects,
    experience: [
      {
        role: safeRole,
        company: "Independent / Workshop Projects",
        period: "2023 - Present",
        bullets: achievements.slice(0, 3)
      }
    ],
    education: [
      {
        degree: "BSc in Computer Science",
        institution: "University",
        year: "2024"
      }
    ],
    achievements
  };
}

function buildCvStats(content) {
  return {
    skillsCount: content.skills.length,
    projectCount: content.projects.length,
    achievementCount: content.achievements.length,
    experienceCount: content.experience.length
  };
}

function createCvPdfBuffer(record) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { candidate, summary, skills, projects, experience, education, achievements } = record.content;

    doc.fontSize(20).text(candidate.fullName || "Candidate Name");
    doc.fontSize(12).fillColor("#333333").text(candidate.title || "Software Engineer");
    doc.moveDown(0.5);

    const contactLine = [candidate.email, candidate.phone, candidate.location].filter(Boolean).join(" | ");
    if (contactLine) {
      doc.fontSize(10).fillColor("#444444").text(contactLine);
    }

    const profileLine = [
      candidate.linkedIn ? `LinkedIn: ${candidate.linkedIn}` : null,
      candidate.gitHubUsername ? `GitHub: ${candidate.gitHubUsername}` : null,
      candidate.stackOverflowUserId ? `Stack Overflow: ${candidate.stackOverflowUserId}` : null
    ].filter(Boolean).join(" | ");

    if (profileLine) {
      doc.fontSize(10).fillColor("#444444").text(profileLine);
    }

    doc.moveDown();
    doc.fontSize(13).fillColor("#000000").text("Professional Summary");
    doc.fontSize(11).fillColor("#222222").text(summary);

    doc.moveDown();
    doc.fontSize(13).fillColor("#000000").text("Skills");
    doc.fontSize(11).text(skills.join(", "));

    doc.moveDown();
    doc.fontSize(13).fillColor("#000000").text("Experience");
    experience.forEach((item) => {
      doc.fontSize(11).fillColor("#111111").text(`${item.role} | ${item.company} (${item.period})`);
      item.bullets.forEach((bullet) => {
        doc.fontSize(10).fillColor("#222222").text(`- ${bullet}`);
      });
      doc.moveDown(0.4);
    });

    doc.moveDown(0.3);
    doc.fontSize(13).fillColor("#000000").text("Projects");
    projects.forEach((project) => {
      doc.fontSize(11).fillColor("#111111").text(project.name);
      doc.fontSize(10).fillColor("#222222").text(`- ${project.impact}`);
      doc.fontSize(10).fillColor("#222222").text(`- Tech: ${project.tech.join(", ")}`);
      doc.moveDown(0.4);
    });

    doc.moveDown(0.3);
    doc.fontSize(13).fillColor("#000000").text("Education");
    education.forEach((item) => {
      doc.fontSize(11).fillColor("#222222").text(`${item.degree} - ${item.institution} (${item.year})`);
    });

    doc.moveDown(0.3);
    doc.fontSize(13).fillColor("#000000").text("Achievements");
    achievements.forEach((item) => {
      doc.fontSize(10).fillColor("#222222").text(`- ${item}`);
    });

    doc.end();
  });

  const skills = ["JavaScript", "Node.js", "API Integration", "Problem Solving"];
  const projects = [
    `${gitHubUsername || "candidate"}-portfolio`,
    "full-stack-profile-analyzer",
    "resume-composer"
  ];

  return {
    summary:
      `Results-driven ${safeRole} with hands-on project delivery and strong ownership mindset. ` +
      "Comfortable turning technical profile signals into clear business value.",
    skills,
    projects,
    achievements: lines.length ? lines : ["Built and shipped multiple web features with measurable user impact."],
    profile: {
      gitHubUsername: gitHubUsername || null,
      stackOverflowUserId: stackOverflowUserId || null
    }
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ai-cv-generator" });
});

app.post("/api/generate-cv", (req, res) => {
  const {
    fullName,
    email,
    phone,
    location,
    linkedIn,
    gitHubUsername,
    stackOverflowUserId,
    focusRole,
    yearsExperience,
    highlights,
    topSkills
  } = req.body || {};

  if (!gitHubUsername && !stackOverflowUserId && !fullName) {
    return res.status(400).json({
      error: "Provide at least fullName, gitHubUsername, or stackOverflowUserId"
    });
  }

  const cvId = `cv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const content = buildCvFromInput({
    fullName,
    email,
    phone,
    location,
    linkedIn,
    gitHubUsername,
    stackOverflowUserId,
    focusRole,
    yearsExperience,
    highlights,
    topSkills
  });
  const generatedAt = new Date().toISOString();
  const stats = buildCvStats(content);

  const response = {
    cvId,
    status: "completed",
    generatedAt,
    downloadUrl: `/api/cvs/${cvId}/pdf`,
    detailsUrl: `/api/cvs/${cvId}`,
    stats,
    content
  };

  generatedCvs.set(cvId, response);
  return res.status(200).json(response);
});

app.get("/api/cvs", (_req, res) => {
  const items = Array.from(generatedCvs.values()).reverse();
  return res.json({
    total: items.length,
    items
  });
});

app.get("/api/cvs/:cvId", (req, res) => {
  const item = generatedCvs.get(req.params.cvId);
  if (!item) {
    return res.status(404).json({ error: "CV not found" });
  }

  return res.json(item);
});

app.get("/api/cvs/:cvId/pdf", async (req, res) => {
  const item = generatedCvs.get(req.params.cvId);
  if (!item) {
    return res.status(404).json({ error: "CV not found" });
  }

  try {
    const pdfBuffer = await createCvPdfBuffer(item);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${item.cvId}.pdf\"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate PDF", message: error.message });
  }
});

app.listen(port, () => {
  console.log(`AI CV Generator running on port ${port}`);
});
