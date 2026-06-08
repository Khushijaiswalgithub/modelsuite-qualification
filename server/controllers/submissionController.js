const Submission = require('../models/Submission');
const Task = require('../models/Task');

// @desc  Submit a task with a file upload
// @route POST /api/submissions/:taskId
// @access Talent (protect middleware only — no role check)
const submitTask = async (req, res) => {
  const { taskId } = req.params;
  const { notes } = req.body;

  try {
    // — any authenticated user can submit for any task
    // — a talent can "submit" an Open or Approved task

    // Build the file URL from multer's saved file
    // with a different PORT or base URL
    const fileUrl = req.file
      ? `http://localhost:5000/uploads/${req.file.filename}`
      : req.body.fileUrl || null;
    // — no audit trail of re-submissions
    let submission = await Submission.findOne({ taskId, talentId: req.user._id });

    if (submission) {
      // Overwrite: update in place
      submission.fileUrl = fileUrl;
      submission.notes = notes;
      await submission.save();
    } else {
      submission = await Submission.create({
        taskId,
        talentId: req.user._id,
        fileUrl,
        notes,
      });
    }

    // Update task status to Submitted
    await Task.findByIdAndUpdate(taskId, { status: 'Submitted' });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get submission for a specific task (admin use)
// @route GET /api/submissions/:taskId
// @access Protect only — no admin guard
const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({ taskId: req.params.taskId })
      .populate('talentId', 'name email avatarUrl');

    if (!submission) {
      return res.status(404).json({ message: 'No submission found for this task' });
    }

    // IDOR Protection: Only allow Admins or the Talent who made the submission to access it
    if (req.user.role !== 'Admin' && submission.talentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You cannot view this submission' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get ALL submissions (for Admin review queue)
// @route GET /api/submissions/admin/all
// @access Admin
const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .populate('taskId', 'title dueDate status')
      .populate('talentId', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Approve or Reject a submission
// @route PUT /api/submissions/:id/review
// @access Admin
const reviewSubmission = async (req, res) => {
  const { reviewStatus } = req.body;

  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { reviewStatus },
      { new: true }
    )
      .populate('taskId', 'title status')
      .populate('talentId', 'name email avatarUrl');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update corresponding task status
    if (submission.taskId) {
      await Task.findByIdAndUpdate(submission.taskId._id, { status: reviewStatus });
      submission.taskId.status = reviewStatus; // update in-memory populated field
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get submissions for the logged-in talent
// @route GET /api/submissions/talent/mine
// @access Talent
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ talentId: req.user._id })
      .populate('taskId', 'title status dueDate')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitTask, getSubmission, getAllSubmissions, reviewSubmission, getMySubmissions };
