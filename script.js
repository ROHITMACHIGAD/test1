import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;

// Get the directory name from the current module's URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Set up PostgreSQL client
const pool = new Pool({
    user: 'postgres',       // Replace with your database user
    host: 'localhost',      // Database server host
    database: 'my_db',     // Replace with your database name
    password: 'Rohit1234@#', // Replace with your database password
    port: 5432,             // Default PostgreSQL port
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'top-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 80000 }
}));


app.set('view engine', 'ejs'); // or the template engine you're using
app.set('views', path.join(__dirname, 'views')); // Adjust path as necessary



// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle user sign-up
app.post('/usersignup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'usersignup.html'));
});

// Handle user login
app.post('/userlogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'userlogin.html'));
});


// Route to list all jobs
// Route to list all jobs
app.get('/listalljobs', async (req, res) => {
  

    const userPhno = req.session.phno; // Retrieve phone number from session

    try {
        const query = 'SELECT * FROM joblist'; 
        const result = await pool.query(query);

        // Constructing an array of job objects
        const jobs = result.rows.map(job => ({
            id: job.id,
            typeofjob: job.typeofjob,
            timing: job.timing,
            location: job.location,
            workpay: job.workpay
        }));

        // Render the joblist template with jobs data and user phone number
        res.render('joblist', { jobs, userPhno }); 
    } catch (err) {
        console.error('Error fetching job list:', err);
        return res.status(500).send('Error fetching job list. Please try again.');
    }
});





app.post('/apply', async (req, res) => {
    const { jobId } = req.body; // Get jobId from the request body
    const workerPhno = req.session.wkphno; // Retrieve worker phone number from the session
    console.log('User Phone Number (usphno):', req.session.phno); // Check user phone number
console.log('Worker Phone Number (wkphno):', req.session.wkphno); // Check worker phone number

    if (!workerPhno) {
        return res.status(403).send('You need to log in to apply for a job.'); // Ensure user is logged in
    }

    try {
        // Step 1: Retrieve usphno from the joblist table by jobId
        const jobQuery = `
            SELECT usphno FROM joblist 
            WHERE id = $1
        `;
        const jobResult = await pool.query(jobQuery, [jobId]);

        if (jobResult.rows.length === 0) {
            return res.status(404).send('Job not found.'); // Handle case where job doesn't exist
        }

        const usphno = jobResult.rows[0].usphno; // Get the usphno from the job result
        console.log('Retrieved usphno:', usphno); // Log retrieved usphno

        // Check if usphno is null
        if (!usphno) {
            return res.status(400).send('User phone number is not available for this job.'); // Handle null usphno
        }

        // Step 2: Insert the application into the applicants table
        const applicantQuery = `
            INSERT INTO applicants (usphno, wkphno, applied, approved, jobid) 
            VALUES ($1, $2, TRUE, FALSE, $3)
        `;
        const applicantValues = [usphno, workerPhno, jobId]; // Insert user phone, worker phone, and job ID

        await pool.query(applicantQuery, applicantValues);

        return res.send('Application submitted successfully!'); // Send success response
    } catch (err) {
        console.error('Error applying for job:', err);
        if (!res.headersSent) {
            return res.status(500).send('Error applying for job. Please try again.'); // Handle error
        }
    }
});










// Handle worker sign-up
app.post('/workersignup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'workersignup.html'));
});

// Handle worker login
app.post('/workerlogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'workerlogin.html'));
});
app.post('/postjob', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'jobdetails.html'));
});


app.post('/submitjob', async (req, res) => {
    // Destructure the necessary fields from the request body
    const { usphno, typeofjob, timing, location, workpay } = req.body;

    // Prepare the data for insertion
    const jobData = { usphno, typeofjob, timing, location, workpay };

    try {
        // Step 1: Insert job data into the joblist table
        const query = `
            INSERT INTO joblist (usphno, typeofjob, timing, location, workpay) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `;
        const values = [jobData.usphno, jobData.typeofjob, jobData.timing, jobData.location, jobData.workpay];

        // Execute the query and get the job ID
        const result = await pool.query(query, values);
        const jobId = result.rows[0].id; // Get the ID of the newly inserted job

        console.log('Job Data:', jobData); // Log the submitted job data for debugging
        return res.send('Job submitted successfully!'); // Send a success message
    } catch (err) {
        console.error('Error inserting job data:', err); // Log the error for debugging
        return res.status(500).send('Error submitting job. Please try again.'); // Send an error message
    }
});








// User Sign-up Handler
// User Sign-up Handler
app.post('/us', async (req, res) => {
    const { name, phno, password } = req.body;

    // Store the data in an object
    const userData = { name, phno, password };

    try {
        // Insert user data into the database
        const query = 'INSERT INTO users (name, phno, password) VALUES ($1, $2, $3)';
        const values = [userData.name, userData.phno, userData.password];

        await pool.query(query, values);

        console.log('User Data:', userData); // For demonstration purposes
        return res.send('Sign-up successful!'); // Use return to prevent further execution
    } catch (err) {
        console.error('Error inserting data:', err);
        if (!res.headersSent) {
            return res.status(500).send('Error signing up. Please try again.'); // Use return here too
        }
    }
});


// User Login Handler
// User Login Handler
app.post('/ul', async (req, res) => {
    const { phno, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE phno = $1';
        const values = [phno];

        const result = await pool.query(query, values);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            if (user.password === password) {
                console.log('User Login Successful:', { phno });
                
                // Store the phone number in the session
                req.session.phno = user.phno; 
                
                return res.sendFile(path.join(__dirname, 'public', 'userdashboard.html'));
            } else {
                console.log('Incorrect password for user:', phno);
                return res.status(401).send('Incorrect password.');
            }
        } else {
            console.log('User not found:', phno);
            return res.status(404).send('User not found.');
        }
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).send('Error logging in. Please try again.');
    }
});




app.post('/ws', async (req, res) => {
    const { name, phno, password } = req.body;

    // Store the data in an object
    const userData = { name,phno, password };

    try {
        // Insert user data into the database
        const query = 'INSERT INTO workers (name,phno,password) VALUES ($1, $2, $3)';
        const values = [userData.name, userData.phno, userData.password];

        await pool.query(query, values);

        console.log('User Data:', userData); // For demonstration purposes
        return res.send('Sign-up successful!'); // Use return to prevent further execution
    } catch (err) {
        console.error('Error inserting data:', err);
        if (!res.headersSent) {
            return res.status(500).send('Error signing up. Please try again.'); // Use return here too
        }
    }
});

app.post('/wl', async (req, res) => {
    const { phno, password } = req.body; // Assuming phno and password are included in the login form

    try {
        // Query to find the worker by phone number
        const query = 'SELECT * FROM workers WHERE phno = $1';
        const values = [phno];

        const result = await pool.query(query, values);

        // Check if worker exists
        if (result.rows.length > 0) {
            const worker = result.rows[0];

            // Compare the provided password with the stored password
            if (worker.password === password) {
                console.log('Worker Login Successful:', { phno });

                // Set session values only after successful authentication
                req.session.phno = worker.usphno; // Set user phone number (assuming it's part of the worker object)
                req.session.wkphno = phno; // Set worker phone number
                console.log('Setting session values:');
                console.log('User Phone Number:', req.session.phno);
                console.log('Worker Phone Number:', req.session.wkphno);

                return res.sendFile(path.join(__dirname, 'public', 'workerdashboard.html'));
            } else {
                console.log('Incorrect password for worker:', phno);
                return res.status(401).send('Incorrect password.');
            }
        } else {
            console.log('Worker not found:', phno);
            return res.status(404).send('Worker not found.');
        }
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).send('Error logging in. Please try again.');
    }
});



app.post('/listapplicants', async (req, res) => {
    const userPhno = req.session.phno; // Retrieve the user's phone number from the session
    const filter = req.body.filter; // Get the selected filter from the request

    if (!userPhno) {
        return res.status(403).send('You need to log in first.');
    }

    try {
        // Step 1: Retrieve all applicants where applied = TRUE and approved = FALSE
        const applicantsQuery = `
            SELECT wkphno, jobid FROM applicants 
            WHERE usphno = $1 AND applied = TRUE AND approved = FALSE
        `;
        const applicantsValues = [userPhno];
        const applicantsResult = await pool.query(applicantsQuery, applicantsValues);
        
        if (applicantsResult.rowCount === 0) {
            return res.send('No applicants found for your phone number.');
        }

        const applicants = applicantsResult.rows; // Get all applicants
        const wkphnos = applicants.map(row => row.wkphno); // Extract wkphno for the next query

        // Step 2: Retrieve job details for all applicants
        const jobsQuery = `
            SELECT typeofjob, timing, workpay, id FROM joblist 
            WHERE usphno = $1
        `;
        const jobsValues = [userPhno];
        const jobsResult = await pool.query(jobsQuery, jobsValues);
        const jobs = jobsResult.rows;

        // Step 3: Retrieve worker names and ratings from workers table
        const workersQuery = `
            SELECT phno, name, rating FROM workers 
            WHERE phno = ANY($1::text[])
        `;
        const workersValues = [wkphnos]; // Pass the array of wkphno
        const workersResult = await pool.query(workersQuery, workersValues);
        const workers = workersResult.rows;

        // Step 4: Combine job details with worker names and ratings, keeping the original index
        const combinedData = applicants.map((applicant, index) => {
            const worker = workers.find(w => w.phno === applicant.wkphno) || { name: 'Unknown', rating: null };
            const job = jobs.find(job => job.id === applicant.jobid) || { typeofjob: 'N/A', timing: 'N/A', workpay: 'N/A' };
            return { ...job, name: worker.name, rating: worker.rating, wkphno: applicant.wkphno, originalIndex: index };
        });

        // Step 5: Sort combined data based on the filter
        if (filter === 'highest') {
            combinedData.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Sort from highest to lowest
        } else if (filter === 'lowest') {
            combinedData.sort((a, b) => (a.rating || 0) - (b.rating || 0)); // Sort from lowest to highest
        }

        // Render the applicants page with combined data
        res.render('applicants', { applicants: combinedData, userPhno });
    } catch (err) {
        console.error('Error fetching applicants:', err);
        return res.status(500).send('Error fetching applicants. Please try again.');
    }
});












// Approve applicant route
// Approve applicant
// Approve applicant
app.post('/approve', async (req, res) => {
    const userPhno = req.session.phno; // Retrieve user phone number from session

    try {
        // Step 1: Retrieve wkphno based on usphno
        const applicantQuery = `
            SELECT wkphno FROM applicants 
            WHERE usphno = $1
        `;
        const applicantValues = [userPhno];
        const applicantResult = await pool.query(applicantQuery, applicantValues);
        
        if (applicantResult.rows.length === 0) {
            return res.status(404).send('No applicants found for this user.');
        }

        const wkphno = applicantResult.rows[0].wkphno; // Get the wkphno

        // Step 2: Update the applicants table to set approved to true
        const updateQuery = `
            UPDATE applicants 
            SET approved = TRUE 
            WHERE wkphno = $1
        `;
        await pool.query(updateQuery, [wkphno]);

        return res.send('Applicant approved successfully!');
    } catch (err) {
        console.error('Error approving applicant:', err);
        return res.status(500).send('Error approving applicant. Please try again.');
    }
});

// Reject applicant
app.post('/reject', async (req, res) => {
    const userPhno = req.session.phno; // Retrieve user phone number from session

    try {
        // Step 1: Retrieve wkphno based on usphno
        const applicantQuery = `
            SELECT wkphno FROM applicants 
            WHERE usphno = $1
        `;
        const applicantValues = [userPhno];
        const applicantResult = await pool.query(applicantQuery, applicantValues);
        
        if (applicantResult.rows.length === 0) {
            return res.status(404).send('No applicants found for this user.');
        }

        const wkphno = applicantResult.rows[0].wkphno; // Get the wkphno

        // Step 2: Update the applicants table to set approved to false
        const updateQuery = `
            UPDATE applicants 
            SET approved = FALSE 
            WHERE wkphno = $1
        `;
        await pool.query(updateQuery, [wkphno]);

        return res.send('Applicant rejected successfully!');
    } catch (err) {
        console.error('Error rejecting applicant:', err);
        return res.status(500).send('Error rejecting applicant. Please try again.');
    }
});



app.post('/finalised', async (req, res) => {
    const workerWkphno = req.session.wkphno;

    if (!workerWkphno) {
        return res.status(403).send('You need to log in first.');
    }

    try {
        // Step 1: Check if the worker has approved applications
        const applicantsQuery = `
            SELECT usphno, jobid 
            FROM applicants 
            WHERE wkphno = $1 AND approved = TRUE
        `;
        const applicantValues = [workerWkphno];
        const applicantResult = await pool.query(applicantsQuery, applicantValues);
        
        const approvedApplicants = applicantResult.rows;

        if (approvedApplicants.length === 0) {
            return res.send('No approved applications found.');
        }

        // Step 2: Fetch job details for the approved applications
        const jobIds = approvedApplicants.map(app => app.jobid);
        const jobsQuery = `
            SELECT typeofjob, timing, location, workpay 
            FROM joblist 
            WHERE id = ANY($1::int[])
        `;
        const jobsResult = await pool.query(jobsQuery, [jobIds]);

        const jobs = jobsResult.rows;

        // Step 3: Render the results
        res.render('finalizedJobs', { jobs, workerWkphno });
    } catch (err) {
        console.error('Error fetching finalized jobs:', err);
        return res.status(500).send('Error fetching finalized jobs. Please try again.');
    }
});


app.get('/finish-job', async (req, res) => {
    try {
        // Retrieve user phone number from session
        const usphno = req.session.phno;

        

        // Query to get all job details associated with the user
        const jobResult = await pool.query(
            'SELECT id,typeofjob, timing, location, workpay FROM joblist WHERE usphno = $1',
            [usphno]
        );

        // Check if any jobs are found
        if (jobResult.rows.length === 0) {
            return res.send('No jobs found for this user.');
        }

        // Render the finish job page with job details
        res.render('finish_job', { jobs: jobResult.rows });
    } catch (error) {
        console.error('Error retrieving job details:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/finishjob', async (req, res) => {
    const client = await pool.connect();
    try {
        const jobId = req.body.jobId; // Get the job ID from the request body
        console.log('Job ID:', jobId);
        
        if (!jobId || isNaN(jobId) || jobId <= 0) {
            return res.status(400).send('Invalid Job ID');
        }

        await client.query('BEGIN');

        // Delete the job from joblist
        const deleteJobResult = await client.query('DELETE FROM joblist WHERE id = $1 RETURNING *', [jobId]);

        // Check if the job was found and deleted
        if (deleteJobResult.rowCount === 0) {
            return res.status(404).send('Job not found');
        }

        // Retrieve applicants associated with the job
        const applicantsResult = await client.query('SELECT wkphno FROM applicants WHERE jobid = $1', [jobId]);

        if (applicantsResult.rowCount === 0) {
            console.log('No applicants found for this job.');
        }

        // Delete applicants associated with the job
        await client.query('DELETE FROM applicants WHERE jobid = $1', [jobId]);

        // Increment jobsfinished in the workers table for each applicant
        for (const applicant of applicantsResult.rows) {
            const { wkphno } = applicant;

            // Increment jobsfinished by 1
            const updateResult = await client.query(
                'UPDATE workers SET jobsfinished = COALESCE(jobsfinished, 0) + 1 WHERE phno = $1 RETURNING jobsfinished',
                [wkphno]
            );

            if (updateResult.rowCount === 0) {
                console.log(`No worker found with phone number: ${wkphno}`);
            } else {
                const jobsFinishedCount = updateResult.rows[0].jobsfinished;
                console.log(`Updated jobsfinished for worker with phone number: ${wkphno}, new count: ${jobsFinishedCount}`);

                // Check if jobsfinished is now >= 5 and update israting if true
                if (jobsFinishedCount >= 5) {
                    await client.query(
                        'UPDATE workers SET israting = TRUE WHERE phno = $1',
                        [wkphno]
                    );
                    console.log(`Set israting to TRUE for worker with phone number: ${wkphno}`);
                }
                
                // Send the worker's phone number to the feedback page
                const feedbackData = { wkphno }; // Prepare data for feedback page
                res.render('feedback', { feedbackData }); // Use a template engine to render feedback page
                return; // Ensure we exit the route here
            }
        }

        await client.query('COMMIT');
        res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error finishing job:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        client.release();
    }
});




app.post('/submitfeedback', async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Request body:', req.body); // Log the request body
        const { rating, feedbackText, wkphno } = req.body;

        // Validate inputs
        if (!rating || !wkphno || !feedbackText) {
            return res.status(400).send('Rating, phone number, and feedback text are required');
        }

        await client.query('BEGIN');

        // Update the worker's rating
        const updateRatingResult = await client.query(
            'UPDATE workers SET rating = COALESCE(rating, 0) + $1 WHERE phno = $2',
            [rating, wkphno]
        );

        if (updateRatingResult.rowCount === 0) {
            return res.status(404).send('Worker not found');
        }

        // Insert the feedback into the feedback table
        await client.query(
            'INSERT INTO feedback (feedback_text) VALUES ($1)',
            [feedbackText]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting feedback:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        client.release();
    }
});






// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
