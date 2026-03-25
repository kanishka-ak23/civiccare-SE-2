import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() }); // In-memory storage for base64 conversion or AI processing

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!name || !email || !role) {
            return res.status(400).json({ error: 'Missing name, email, or role' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists. Please login.' });
        }

        const user = await prisma.user.create({
            data: { name, email, role }
        });

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ error: 'Missing email or role' });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ error: 'User does not exist. Please sign up.' });
        }

        // Role check
        if (user.role !== role) {
            return res.status(403).json({ error: 'Mismatched role for this account' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// -------------------------------------------------------------
// ISSUES ENDPOINTS
// -------------------------------------------------------------
// Helper to format issue for frontend
const formatIssue = (issue: any) => {
    let finalScore = issue.aiPriorityScore;
    let finalReasoning = issue.aiReasoning || "Priority assessed by AI";

    // AGEING ALGORITHM: Boost priority for older unassigned tasks
    if (issue.status === 'PENDING') {
        const createDate = new Date(issue.createdAt);
        const now = new Date();
        // Calculate days old (can mock or test by doing hours instead if we want fast starvation, but let's stick to days natively and maybe hours for realism if needed. We'll use hours to show starvation faster in a demo, or days)
        // Let's use hours for demonstration purposes so it doesn't take days to see it
        const hoursOld = Math.max(0, Math.floor((now.getTime() - createDate.getTime()) / (1000 * 60 * 60)));

        if (hoursOld > 0 && finalScore < 100) {
            const boost = Math.min(100 - finalScore, hoursOld * 2); // +2 points per every hour it sits pending
            if (boost > 0) {
                finalScore += boost;
                finalReasoning += ` | +${boost} Ageing Boost (Unresolved for ${hoursOld} hours)`;
            }
        }
    }

    return {
        id: issue.id,
        citizenName: issue.citizen?.name || 'Unknown',
        category: issue.category,
        description: issue.description,
        image: issue.imageUrl,
        location: {
            lat: issue.latitude,
            lng: issue.longitude,
            address: issue.locationName
        },
        status: issue.status,
        priorityScore: finalScore,
        priorityReasoning: finalReasoning,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        assignedDepartment: issue.assignedTo,
        adminNotes: issue.progressNotes,
        dismissalReason: issue.rejectionReason,
        feedback: issue.feedback ? JSON.parse(issue.feedback) : undefined
    };
};

app.get('/api/issues', async (req, res) => {
    try {
        const { role, userId } = req.query;

        if (role === 'ADMIN') {
            const issues = await prisma.issue.findMany({
                orderBy: { aiPriorityScore: 'desc' },
                include: { citizen: true }
            });
            return res.json(issues.map(formatIssue));
        }

        if (role === 'CITIZEN' && userId) {
            const issues = await prisma.issue.findMany({
                where: { citizenId: String(userId) },
                orderBy: { createdAt: 'desc' },
                include: { citizen: true }
            });
            return res.json(issues.map(formatIssue));
        }

        res.status(400).json({ error: 'Invalid parameters' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

app.post('/api/issues', async (req, res) => {
    try {
        const { citizenId, category, description, image, location, status, priorityScore, priorityReasoning } = req.body;

        const issue = await prisma.issue.create({
            data: {
                citizenId,
                category,
                description,
                imageUrl: image || '',
                latitude: location?.lat || 0,
                longitude: location?.lng || 0,
                locationName: location?.address || '',
                aiIsReal: true,
                aiPriorityScore: priorityScore || 0,
                aiReasoning: priorityReasoning || '',
                status: status || 'PENDING'
            },
            include: { citizen: true }
        });

        res.status(201).json(formatIssue(issue));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

app.put('/api/issues/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, description, image, location, status, assignedDepartment, adminNotes, dismissalReason, feedback } = req.body;

        const updateData: any = {};
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.imageUrl = image;
        if (location !== undefined) {
            updateData.latitude = location.lat;
            updateData.longitude = location.lng;
            updateData.locationName = location.address || '';
        }
        if (status !== undefined) updateData.status = status;
        if (assignedDepartment !== undefined) updateData.assignedTo = assignedDepartment;
        if (adminNotes !== undefined) updateData.progressNotes = adminNotes;
        if (dismissalReason !== undefined) updateData.rejectionReason = dismissalReason;
        if (feedback !== undefined) updateData.feedback = JSON.stringify(feedback);

        const issue = await prisma.issue.update({
            where: { id },
            data: updateData,
            include: { citizen: true }
        });

        res.json(formatIssue(issue));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update issue' });
    }
});

app.delete('/api/issues/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.issue.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete issue' });
    }
});


// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
