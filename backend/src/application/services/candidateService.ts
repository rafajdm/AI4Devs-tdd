import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { PrismaClient } from '@prisma/client';

export class CandidateService {
    private prismaClient: PrismaClient;

    constructor(prismaClient: PrismaClient) {
        this.prismaClient = prismaClient;
    }

    async addCandidate(candidateData: any) {
        try {
            validateCandidateData(candidateData);
        } catch (error: any) {
            throw new Error(error);
        }

        const candidate = new Candidate(candidateData);
        try {
            const savedCandidate = await candidate.save();
            const candidateId = savedCandidate.id;

            if (candidateData.educations) {
                for (const education of candidateData.educations) {
                    const educationModel = new Education(education);
                    educationModel.candidateId = candidateId;
                    await educationModel.save();
                    candidate.education.push(educationModel);
                }
            }

            if (candidateData.workExperiences) {
                for (const experience of candidateData.workExperiences) {
                    const experienceModel = new WorkExperience(experience);
                    experienceModel.candidateId = candidateId;
                    await experienceModel.save();
                    candidate.workExperience.push(experienceModel);
                }
            }

            if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
                const resumeModel = new Resume(candidateData.cv);
                resumeModel.candidateId = candidateId;
                await resumeModel.save();
                candidate.resumes.push(resumeModel);
            }
            return savedCandidate;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('The email already exists in the database');
            }
            throw error;
        }
    }

    async updateCandidate(updateData: any) {
        try {
            const candidate = await Candidate.findOne(updateData.id);
            if (!candidate) {
                throw new Error('Candidate not found');
            }
    
            // Start a transaction
            return await this.prismaClient.$transaction(async (prisma) => {
                // Delete existing relations if they are being updated
                if (updateData.educations) {
                    await prisma.education.deleteMany({
                        where: { candidateId: updateData.id }
                    });
                }
                
                if (updateData.workExperiences) {
                    await prisma.workExperience.deleteMany({
                        where: { candidateId: updateData.id }
                    });
                }
    
                // Update candidate with new data
                const updatedCandidate = await prisma.candidate.update({
                    where: { id: updateData.id },
                    data: {
                        firstName: updateData.firstName,
                        lastName: updateData.lastName,
                        ...(updateData.educations && {
                            educations: {
                                create: updateData.educations.map((edu: any) => ({
                                    institution: edu.institution,
                                    title: edu.title,
                                    startDate: new Date(edu.startDate),
                                    endDate: edu.endDate ? new Date(edu.endDate) : null
                                }))
                            }
                        }),
                        ...(updateData.workExperiences && {
                            workExperiences: {
                                create: updateData.workExperiences.map((exp: any) => ({
                                    company: exp.company,
                                    position: exp.position,
                                    description: exp.description,
                                    startDate: new Date(exp.startDate),
                                    endDate: exp.endDate ? new Date(exp.endDate) : null
                                }))
                            }
                        })
                    },
                    include: {
                        educations: true,
                        workExperiences: true
                    }
                });
    
                return updatedCandidate;
            });
        } catch (error: any) {
            throw error;
        }
    }
}

// Keep the function export for backward compatibility
export const addCandidate = async (candidateData: any) => {
    const service = new CandidateService(new PrismaClient());
    return service.addCandidate(candidateData);
};