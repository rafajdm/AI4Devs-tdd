import { Request, Response } from 'express';
import { addCandidate } from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ 
            message: 'Candidate added successfully', 
            data: candidate 
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            // Check if it's a validation error (known error cases)
            if (error.message.startsWith('Invalid')) {
                res.status(400).json({ 
                    message: 'Error adding candidate', 
                    error: error.message 
                });
            } else {
                // Unknown errors are treated as server errors
                res.status(500).json({ 
                    message: 'Internal server error', 
                    error: error.message 
                });
            }
        } else {
            res.status(500).json({ 
                message: 'Internal server error', 
                error: 'Unknown error' 
            });
        }
    }
};

export { addCandidate };