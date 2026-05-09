const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();
const port = process.env.PORT || 8080;
const generatedCvs = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function toList(input, fallback, limit = 10) {
  const values = (input || "")
    .split(/\r?\n|,/) 
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);

  return values.length ? values : fallback;
}

async function fetchJson(url, extraHeaders = {}) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ai-cv-generator-workshop",
      Accept: "application/json",
      ...extraHeaders
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ai-cv-generator-workshop"
    }
  });

  if (!response.ok) {
    throw new Error(`Image request failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getGitHubSignals(username) {
  if (!username) {
    return null;
  }

  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const profile = await fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`, headers);
  const repos = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    headers
  );

  const topRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5)
    .map((repo) => ({
      name: repo.name,
      description: repo.description || "Production-grade project with practical engineering outcomes.",
      stars: repo.stargazers_count || 0,
      language: repo.language || "General",
      htmlUrl: repo.html_url,
      updatedAt: repo.updated_at
    }));

  const languageSet = new Set();
  repos.forEach((repo) => {
    if (repo.language) {
      languageSet.add(repo.language);
    }
  });

  return {
    profile,
    topRepos,
    languages: Array.from(languageSet),
    publicRepos: profile.public_repos || repos.length,
    followers: profile.followers || 0
  };
}

async function getStackOverflowSignals(userId) {
  if (!userId) {
    return null;
  }

  const user = await fetchJson(`https://api.stackexchange.com/2.3/users/${encodeURIComponent(userId)}?site=stackoverflow`);
  const tags = await fetchJson(
    `https://api.stackexchange.com/2.3/users/${encodeURIComponent(userId)}/top-tags?site=stackoverflow`
  );

  const userItem = (user.items && user.items[0]) || null;
  const topTags = (tags.items || []).slice(0, 8).map((item) => item.tag_name);

  return {
    user: userItem,
    topTags,
    reputation: userItem ? userItem.reputation : 0,
    badgeCounts: userItem ? userItem.badge_counts : { gold: 0, silver: 0, bronze: 0 }
  };
}

function buildSummary({ safeRole, safeYears, github, stackOverflow }) {
  const repoText = github ? `${github.publicRepos} public repositories` : "multiple production-oriented projects";
  const soText = stackOverflow
    ? `${stackOverflow.reputation.toLocaleString("en-US")} Stack Overflow reputation`
    : "community-validated technical problem solving";

  return (
    `Professional ${safeRole} with ${safeYears} years of hands-on software delivery. ` +
    `Portfolio reflects ${repoText}, and technical depth is supported by ${soText}. ` +
    "Focuses on dependable APIs, measurable product impact, and clean engineering execution."
  );
}

function buildProjects(github) {
  if (github && github.topRepos.length) {
    return github.topRepos.map((repo) => ({
      name: repo.name,
      impact: repo.description,
      tech: [repo.language],
      metrics: `${repo.stars} stars`,
      link: repo.htmlUrl
    }));
  }

  return [
    {
      name: "portfolio-service",
      impact: "Delivered reliable backend endpoints with clear API contracts.",
      tech: ["Node.js", "Express"],
      metrics: "Production ready",
      link: null
    }
  ];
}

function buildSkills({ manualSkills, github, stackOverflow }) {
  const merged = [
    ...manualSkills,
    ...(github ? github.languages : []),
    ...(stackOverflow ? stackOverflow.topTags : [])
  ];

  const deduped = [];
  const seen = new Set();
  merged.forEach((item) => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  });

  return deduped.slice(0, 15);
}

function buildCvContent(input, github, stackOverflow) {
  const safeRole = input.focusRole || "Software Engineer";
  const safeYears = input.yearsExperience || "3+";
  const manualSkills = toList(input.topSkills, ["JavaScript", "Node.js", "REST APIs", "Testing"], 10);
  const achievements = toList(
    input.highlights,
    [
      "Built and shipped reliable product features with measurable quality improvements.",
      "Strengthened engineering workflows through better validation and observability.",
      "Reduced delivery risk by introducing predictable API and release patterns."
    ],
    8
  );

  const skills = buildSkills({ manualSkills, github, stackOverflow });
  const projects = buildProjects(github);
  const summary = buildSummary({ safeRole, safeYears, github, stackOverflow });

  const stackOverflowBadges = stackOverflow
    ? `Badges - Gold: ${stackOverflow.badgeCounts.gold}, Silver: ${stackOverflow.badgeCounts.silver}, Bronze: ${stackOverflow.badgeCounts.bronze}`
    : null;

  return {
    candidate: {
      fullName: input.fullName || (github && github.profile.name) || "Candidate Name",
      title: safeRole,
      yearsExperience: safeYears,
      email: input.email || null,
      phone: input.phone || null,
      location: input.location || (github && github.profile.location) || null,
      linkedIn: input.linkedIn || null,
      gitHubUsername: input.gitHubUsername || null,
      stackOverflowUserId: input.stackOverflowUserId || null,
      profileImageUrl:
        input.profileImageUrl ||
        (github && github.profile.avatar_url) ||
        (stackOverflow && stackOverflow.user && stackOverflow.user.profile_image) ||
        null
    },
    summary,
    skills,
    projects,
    experience: [
      {
        role: safeRole,
        company: "Independent / Portfolio Work",
        period: "Recent Experience",
        bullets: achievements.slice(0, 4)
      }
    ],
    education: [
      {
        degree: "BSc in Computer Science",
        institution: "University",
        year: "Recent"
      }
    ],
    achievements,
    sourceSignals: {
      github: github
        ? {
            username: github.profile.login,
            publicRepos: github.publicRepos,
            followers: github.followers
          }
        : null,
      stackOverflow: stackOverflow
        ? {
            userId: input.stackOverflowUserId,
            reputation: stackOverflow.reputation,
            badges: stackOverflow.badgeCounts,
            topTags: stackOverflow.topTags
          }
        : null,
      notes: stackOverflowBadges
    }
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

async function createCvPdfBuffer(record) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      const { candidate, summary, skills, projects, experience, education, achievements } = record.content;

      let imagePlaced = false;
      if (candidate.profileImageUrl) {
        try {
          const imageBuffer = await fetchBuffer(candidate.profileImageUrl);
          doc.image(imageBuffer, 420, 45, { fit: [120, 120], align: "right" });
          imagePlaced = true;
        } catch (_error) {
          imagePlaced = false;
        }
      }

      doc.fontSize(22).fillColor("#111111").text(candidate.fullName || "Candidate Name", 50, 50);
      doc.fontSize(12).fillColor("#374151").text(candidate.title || "Software Engineer");
      if (imagePlaced) {
        doc.moveDown(0.2);
      }

      const contactLine = [candidate.email, candidate.phone, candidate.location].filter(Boolean).join(" | ");
      if (contactLine) {
        doc.fontSize(10).fillColor("#4B5563").text(contactLine);
      }

      const profileLine = [
        candidate.linkedIn ? `LinkedIn: ${candidate.linkedIn}` : null,
        candidate.gitHubUsername ? `GitHub: ${candidate.gitHubUsername}` : null,
        candidate.stackOverflowUserId ? `Stack Overflow: ${candidate.stackOverflowUserId}` : null
      ]
        .filter(Boolean)
        .join(" | ");

      if (profileLine) {
        doc.fontSize(10).fillColor("#4B5563").text(profileLine);
      }

      doc.moveDown(0.9);
      doc.fontSize(13).fillColor("#0F172A").text("Professional Summary");
      doc.fontSize(10.5).fillColor("#1F2937").text(summary, { lineGap: 2 });

      doc.moveDown(0.6);
      doc.fontSize(13).fillColor("#0F172A").text("Skills");
      doc.fontSize(10.5).fillColor("#1F2937").text(skills.join(", "));

      doc.moveDown(0.6);
      doc.fontSize(13).fillColor("#0F172A").text("Professional Experience");
      experience.forEach((item) => {
        doc.fontSize(11).fillColor("#111827").text(`${item.role} | ${item.company} (${item.period})`);
        item.bullets.forEach((bullet) => {
          doc.fontSize(10).fillColor("#1F2937").text(`- ${bullet}`);
        });
        doc.moveDown(0.3);
      });

      doc.moveDown(0.3);
      doc.fontSize(13).fillColor("#0F172A").text("Selected Projects");
      projects.forEach((project) => {
        doc.fontSize(11).fillColor("#111827").text(project.name);
        doc.fontSize(10).fillColor("#1F2937").text(`- ${project.impact}`);
        doc.fontSize(10).fillColor("#1F2937").text(`- Tech: ${(project.tech || []).join(", ")}`);
        if (project.metrics) {
          doc.fontSize(10).fillColor("#1F2937").text(`- Metrics: ${project.metrics}`);
        }
        if (project.link) {
          doc.fontSize(10).fillColor("#2563EB").text(`- Link: ${project.link}`);
        }
        doc.moveDown(0.25);
      });

      doc.moveDown(0.3);
      doc.fontSize(13).fillColor("#0F172A").text("Education");
      education.forEach((item) => {
        doc.fontSize(10.5).fillColor("#1F2937").text(`${item.degree} - ${item.institution} (${item.year})`);
      });

      doc.moveDown(0.3);
      doc.fontSize(13).fillColor("#0F172A").text("Achievements");
      achievements.forEach((item) => {
        doc.fontSize(10).fillColor("#1F2937").text(`- ${item}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ai-cv-generator" });
});

app.post("/api/generate-cv", async (req, res) => {
  const input = req.body || {};

  if (!input.gitHubUsername && !input.stackOverflowUserId && !input.fullName) {
    return res.status(400).json({
      error: "Provide at least fullName, gitHubUsername, or stackOverflowUserId"
    });
  }

  let github = null;
  let stackOverflow = null;
  const warnings = [];

  if (input.gitHubUsername) {
    try {
      github = await getGitHubSignals(input.gitHubUsername);
    } catch (error) {
      warnings.push(`GitHub fetch failed: ${error.message}`);
    }
  }

  if (input.stackOverflowUserId) {
    try {
      stackOverflow = await getStackOverflowSignals(input.stackOverflowUserId);
    } catch (error) {
      warnings.push(`Stack Overflow fetch failed: ${error.message}`);
    }
  }

  const cvId = `cv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const content = buildCvContent(input, github, stackOverflow);
  const generatedAt = new Date().toISOString();
  const stats = buildCvStats(content);

  const response = {
    cvId,
    status: "completed",
    generatedAt,
    downloadUrl: `/api/cvs/${cvId}/pdf`,
    detailsUrl: `/api/cvs/${cvId}`,
    stats,
    warnings,
    content
  };

  generatedCvs.set(cvId, response);
  return res.status(200).json(response);
});

app.get("/api/cvs", (_req, res) => {
  const items = Array.from(generatedCvs.values()).reverse();
  return res.json({ total: items.length, items });
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
