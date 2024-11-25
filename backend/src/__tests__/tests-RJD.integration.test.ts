import { PrismaClient } from '@prisma/client';
import { CandidateService } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';
import { Resume } from '../domain/models/Resume';  // Add this import
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

describe('Candidate Integration', () => {
    let prisma: PrismaClient;
    let candidateService: CandidateService;

    beforeAll(async () => {
        // Create test database and run migrations
        prisma = new PrismaClient();
        try {
            await prisma.$connect();
        } catch (error) {
            console.error('Failed to connect to test database:', error);
            throw error;
        }
        candidateService = new CandidateService(prisma);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.education.deleteMany();
        await prisma.workExperience.deleteMany();
        await prisma.resume.deleteMany();
        await prisma.candidate.deleteMany();
    });

    test('should create a candidate with all relationships', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '666555444',
            address: '123 Main St',
            educations: [{
                institution: 'University',
                title: 'Computer Science',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }],
            workExperiences: [{
                company: 'Tech Corp',
                position: 'Developer',
                description: 'Full Stack Development',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }],
            cv: {
                filePath: '/path/to/cv.pdf',
                fileType: 'application/pdf'
            }
        };

        // Act
        const result = await candidateService.addCandidate(candidateData);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.firstName).toBe(candidateData.firstName);
        expect(result.lastName).toBe(candidateData.lastName);
        expect(result.email).toBe(candidateData.email);
    });

    test('should create a candidate with minimal required fields', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'minimal@example.com'
        };
    
        // Act
        const result = await candidateService.addCandidate(candidateData);
    
        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.firstName).toBe(candidateData.firstName);
        expect(result.lastName).toBe(candidateData.lastName);
        expect(result.email).toBe(candidateData.email);
    
        // Verify database persistence
        const savedCandidate = await prisma.candidate.findUnique({
            where: { email: candidateData.email }
        });
        expect(savedCandidate).toBeDefined();
        expect(savedCandidate?.firstName).toBe(candidateData.firstName);
        expect(savedCandidate?.lastName).toBe(candidateData.lastName);
    });

    test('should handle duplicate email creation', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'duplicate@example.com'
        };
    
        // Create first candidate
        await candidateService.addCandidate(candidateData);
    
        // Act & Assert
        await expect(candidateService.addCandidate({
            ...candidateData,
            firstName: 'Jane'  // Different name, same email
        })).rejects.toThrow('The email already exists in the database');
    
        // Verify only one record exists
        const candidates = await prisma.candidate.findMany({
            where: { email: candidateData.email }
        });
        expect(candidates).toHaveLength(1);
    });

    test('should persist education relationship correctly', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'education.test@example.com',
            educations: [{
                institution: 'University',
                title: 'Computer Science',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }]
        };
    
        // Act
        const result = await candidateService.addCandidate(candidateData);
    
        // Assert
        // Check candidate was created
        expect(result.id).toBeDefined();
        
        // Check education was persisted
        const savedEducation = await prisma.education.findFirst({
            where: { candidateId: result.id }
        });
        expect(savedEducation).toBeDefined();
        expect(savedEducation?.institution).toBe(candidateData.educations[0].institution);
        expect(savedEducation?.title).toBe(candidateData.educations[0].title);
    });

    test('should persist work experience relationship correctly', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'workexp.test@example.com',
            workExperiences: [{
                company: 'Tech Corp',
                position: 'Developer',
                description: 'Full Stack Development',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }]
        };
    
        // Act
        const result = await candidateService.addCandidate(candidateData);
    
        // Assert
        // Check candidate was created
        expect(result.id).toBeDefined();
        
        // Check work experience was persisted
        const savedWorkExperience = await prisma.workExperience.findFirst({
            where: { candidateId: result.id }
        });
        expect(savedWorkExperience).toBeDefined();
        expect(savedWorkExperience?.company).toBe(candidateData.workExperiences[0].company);
        expect(savedWorkExperience?.position).toBe(candidateData.workExperiences[0].position);
        expect(savedWorkExperience?.description).toBe(candidateData.workExperiences[0].description);
    });

    test('should persist CV relationship correctly', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'cv.test@example.com',
            cv: {
                filePath: '/path/to/cv.pdf',
                fileType: 'application/pdf'
            }
        };
    
        // Act
        const result = await candidateService.addCandidate(candidateData);
    
        // Assert
        // Check candidate was created
        expect(result.id).toBeDefined();
        
        // Check CV was persisted
        const savedResume = await prisma.resume.findFirst({
            where: { candidateId: result.id }
        });
        expect(savedResume).toBeDefined();
        expect(savedResume?.filePath).toBe(candidateData.cv.filePath);
        expect(savedResume?.fileType).toBe(candidateData.cv.fileType);
    });

    test('should rollback transaction when CV save fails', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'cv.rollback@example.com',
            cv: {
                // Invalid CV data that will cause a real error
                filePath: '',  // Empty file path will cause validation error
                fileType: 'application/pdf'
            }
        };
    
        // Act & Assert
        await expect(candidateService.addCandidate(candidateData))
            .rejects.toThrow('Invalid CV data');
    
        // Verify candidate was not persisted
        const savedCandidate = await prisma.candidate.findUnique({
            where: { email: candidateData.email }
        });
        expect(savedCandidate).toBeNull();
    });

    test('should cascade delete related records when candidate is deleted', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'cascade.test@example.com',
            educations: [{
                institution: 'University',
                title: 'Computer Science',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }],
            workExperiences: [{
                company: 'Tech Corp',
                position: 'Developer',
                description: 'Full Stack Development',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }]
        };
    
        // Create candidate with relationships
        const result = await candidateService.addCandidate(candidateData);
    
        // Act
        await prisma.candidate.delete({
            where: { id: result.id }
        });
    
        // Assert
        // Verify candidate was deleted
        const deletedCandidate = await prisma.candidate.findUnique({
            where: { id: result.id }
        });
        expect(deletedCandidate).toBeNull();
    
        // Verify related records were deleted
        const education = await prisma.education.findFirst({
            where: { candidateId: result.id }
        });
        expect(education).toBeNull();
    
        const workExperience = await prisma.workExperience.findFirst({
            where: { candidateId: result.id }
        });
        expect(workExperience).toBeNull();
    });

    test('should retrieve candidate with all relationships', async () => {
        // Arrange
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'retrieve.test@example.com',
            educations: [{
                institution: 'University',
                title: 'Computer Science',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }],
            workExperiences: [{
                company: 'Tech Corp',
                position: 'Developer',
                description: 'Full Stack Development',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }]
        };
    
        // Create test data
        await candidateService.addCandidate(candidateData);
    
        // Act
        const savedCandidate = await prisma.candidate.findUnique({
            where: { email: candidateData.email },
            include: {
                educations: true,
                workExperiences: true,
                resumes: true
            }
        });
    
        // Assert
        expect(savedCandidate).toBeDefined();
        expect(savedCandidate?.firstName).toBe(candidateData.firstName);
        expect(savedCandidate?.lastName).toBe(candidateData.lastName);
        expect(savedCandidate?.educations).toHaveLength(1);
        expect(savedCandidate?.workExperiences).toHaveLength(1);
        expect(savedCandidate?.educations[0].institution).toBe(candidateData.educations[0].institution);
        expect(savedCandidate?.workExperiences[0].company).toBe(candidateData.workExperiences[0].company);
    });

    test('should update candidate and related data', async () => {
        // Arrange
        const initialData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'update.test@example.com',
            educations: [{
                institution: 'University',
                title: 'Computer Science',
                startDate: '2020-01-01',
                endDate: '2024-01-01'
            }]
        };
    
        // Create initial candidate
        const candidate = await candidateService.addCandidate(initialData);
    
        const updateData = {
            id: candidate.id,
            firstName: 'Jane',
            lastName: 'Smith',
            educations: [{
                institution: 'New University',
                title: 'Data Science',
                startDate: '2021-01-01',
                endDate: '2025-01-01'
            }]
        };
    
        // Act
        const updatedCandidate = await candidateService.updateCandidate(updateData);
    
        // Assert
        expect(updatedCandidate.firstName).toBe(updateData.firstName);
        expect(updatedCandidate.lastName).toBe(updateData.lastName);
        
        // Verify database was updated
        const savedCandidate = await prisma.candidate.findUnique({
            where: { id: candidate.id },
            include: { educations: true }
        });
        
        expect(savedCandidate?.firstName).toBe(updateData.firstName);
        expect(savedCandidate?.educations[0].institution).toBe(updateData.educations[0].institution);
    });

    test('should update candidate work experience correctly', async () => {
        // Arrange
        const initialData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'work.update@example.com',
            workExperiences: [{
                company: 'Old Corp',
                position: 'Junior Developer',
                description: 'Initial role',
                startDate: '2020-01-01',
                endDate: '2022-01-01'
            }]
        };
    
        // Create initial candidate
        const candidate = await candidateService.addCandidate(initialData);
    
        const updateData = {
            id: candidate.id,
            firstName: 'John',
            lastName: 'Doe',
            workExperiences: [{
                company: 'New Corp',
                position: 'Senior Developer',
                description: 'Promoted role',
                startDate: '2022-01-02',
                endDate: '2024-01-01'
            }]
        };
    
        // Act
        const updatedCandidate = await candidateService.updateCandidate(updateData);
    
        // Assert
        expect(updatedCandidate).toBeDefined();
        
        // Verify database was updated
        const savedCandidate = await prisma.candidate.findUnique({
            where: { id: candidate.id },
            include: { workExperiences: true }
        });
        
        expect(savedCandidate?.workExperiences[0].company).toBe(updateData.workExperiences[0].company);
        expect(savedCandidate?.workExperiences[0].position).toBe(updateData.workExperiences[0].position);
        expect(savedCandidate?.workExperiences[0].description).toBe(updateData.workExperiences[0].description);
    });
});