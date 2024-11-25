import { validateCandidateData } from '../application/validator';
import { CandidateService } from '../application/services/candidateService';
import { PrismaClient } from '@prisma/client';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';
import { Request, Response } from 'express';
import { addCandidateController } from '../presentation/controllers/candidateController';

jest.mock('@prisma/client');
jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Education');
jest.mock('../domain/models/WorkExperience');
jest.mock('../domain/models/Resume');

describe('Candidate Creation', () => {
    describe('Validation', () => {
        test('should validate required fields for new candidate', () => {
            // Arrange
            const invalidCandidate = {
                lastName: 'Doe',
                email: 'john.doe@example.com'
                // firstName is missing
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid name');
        });

        test('should validate lastName field for new candidate', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                email: 'john.doe@example.com'
                // lastName is missing
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid name');
        });

        test('should validate missing email field for new candidate', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe'
                // email is missing
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid email');
        });

        test('should validate email format for new candidate', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email' // invalid email format
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid email');
        });

        test('should allow undefined phone number', () => {
            // Arrange
            const validCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
                // phone is undefined
            };

            // Act & Assert
            expect(() => validateCandidateData(validCandidate)).not.toThrow();
        });

        test('should validate phone number format when provided', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: 'invalid-phone'
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid phone');
        });

        test('should validate required fields in education', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                educations: [{
                    // institution is missing
                    title: 'Computer Science',
                    startDate: '2020-01-01'
                }]
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid institution');
        });

        test('should validate education date format', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: 'invalid-date', // invalid date format
                    endDate: '2024-01-01'
                }]
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid date');
        });

        test('should validate required company field in work experience', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                workExperiences: [{
                    // company is missing
                    position: 'Developer',
                    startDate: '2020-01-01'
                }]
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid company');
        });

        test('should validate required position field in work experience', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    // position is missing
                    startDate: '2020-01-01'
                }]
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid position');
        });

        test('should validate work experience date format', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    position: 'Developer',
                    startDate: 'invalid-date', // invalid date format
                    endDate: '2024-01-01'
                }]
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid date');
        });

        test('should validate CV data structure', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                cv: 'invalid-cv-format' // CV should be an object
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid CV data');
        });

        test('should validate required CV fields', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                cv: {
                    // filePath and fileType are missing
                }
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid CV data');
        });

        test('should validate work experience description length', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    position: 'Developer',
                    startDate: '2020-01-01',
                    description: 'A'.repeat(201) // 201 characters (exceeding 200 limit)
                }]
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid description');
        });

        test('should validate address length', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                address: 'A'.repeat(101) // 101 characters (exceeding 100 limit)
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid address');
        });

        test('should validate name format contains only letters and accents', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John123', // contains numbers
                lastName: 'Doe',
                email: 'john.doe@example.com'
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid name');
        });

        test('should validate name minimum length', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'J', // only 1 character
                lastName: 'Doe',
                email: 'john.doe@example.com'
            };

            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid name');
        });

        test('should validate name maximum length', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'A'.repeat(101), // 101 characters (exceeding 100 limit)
                lastName: 'Doe',
                email: 'john.doe@example.com'
            };
        
            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid name');
        });

        test('should allow valid names with accents and spaces', () => {
            // Arrange
            const validCandidate = {
                firstName: 'José María',
                lastName: 'García-Martínez',
                email: 'jose.garcia@example.com'
            };
        
            // Act & Assert
            expect(() => validateCandidateData(validCandidate))
                .not.toThrow();
        });

        test('should validate phone number format when provided', () => {
            // Arrange
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: 'invalid-phone-number-format'  // Invalid format and too long
            };
        
            // Act & Assert
            expect(() => validateCandidateData(invalidCandidate))
                .toThrow('Invalid phone');
        });

        test('should validate a complete valid candidate with all fields', () => {
            // Arrange
            const validCandidate = {
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
        
            // Act & Assert
            expect(() => validateCandidateData(validCandidate))
                .not.toThrow();
        });
    });

    test('should validate education end date is after start date', () => {
        // Arrange
        const invalidCandidate = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            educations: [{
                institution: 'University',
                title: 'Computer Science',
                startDate: '2024-01-01',
                endDate: '2020-01-01' // End date before start date
            }]
        };

        // Act & Assert
        expect(() => validateCandidateData(invalidCandidate))
            .toThrow('Invalid date order');
    });

    test('should validate work experience end date is after start date', () => {
        // Arrange
        const invalidCandidate = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            workExperiences: [{
                company: 'Tech Corp',
                position: 'Developer',
                startDate: '2024-01-01',
                endDate: '2020-01-01' // End date before start date
            }]
        };

        // Act & Assert
        expect(() => validateCandidateData(invalidCandidate))
            .toThrow('Invalid date order');
    });
});

describe('Candidate Service', () => {
    let candidateService: CandidateService;
    let mockPrismaClient: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        mockPrismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
        candidateService = new CandidateService(mockPrismaClient);
    });

    describe('addCandidate', () => {
        test('should create a candidate with minimal required fields', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
            };

            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };

            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));

            // Act
            const result = await candidateService.addCandidate(candidateData);

            // Assert
            expect(result).toEqual(mockSavedCandidate);
            expect(Candidate).toHaveBeenCalledWith(candidateData);
        });

        test('should create a candidate with education history', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: '2020-01-01',
                    endDate: '2024-01-01'
                }]
            };
        
            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };
        
            const mockSavedEducation = {
                id: 1,
                candidateId: 1,
                ...candidateData.educations[0]
            };
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));
        
            (Education as jest.MockedClass<typeof Education>).mockImplementation((data: any) => ({
                ...data,
                save: jest.fn().mockResolvedValue(mockSavedEducation)
            }));
        
            // Act
            const result = await candidateService.addCandidate(candidateData);
        
            // Assert
            expect(result).toEqual(mockSavedCandidate);
            expect(Candidate).toHaveBeenCalledWith(candidateData);
            expect(Education).toHaveBeenCalledWith(candidateData.educations[0]);
        });

        test('should create a candidate with work experience', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    position: 'Developer',
                    description: 'Full Stack Development',
                    startDate: '2020-01-01',
                    endDate: '2024-01-01'
                }]
            };
        
            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };
        
            const mockSavedWorkExperience = {
                id: 1,
                candidateId: 1,
                ...candidateData.workExperiences[0]
            };
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));
        
            (WorkExperience as jest.MockedClass<typeof WorkExperience>).mockImplementation((data: any) => ({
                ...data,
                save: jest.fn().mockResolvedValue(mockSavedWorkExperience)
            }));
        
            // Act
            const result = await candidateService.addCandidate(candidateData);
        
            // Assert
            expect(result).toEqual(mockSavedCandidate);
            expect(Candidate).toHaveBeenCalledWith(candidateData);
            expect(WorkExperience).toHaveBeenCalledWith(candidateData.workExperiences[0]);
        });

        test('should handle duplicate email error', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
            };
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockRejectedValue({ code: 'P2002' })
            }));
        
            // Act & Assert
            await expect(candidateService.addCandidate(candidateData))
                .rejects
                .toThrow('The email already exists in the database');
        });

        test('should handle generic database errors', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
            };
        
            const dbError = new Error('Database connection failed');
            
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockRejectedValue(dbError)
            }));
        
            // Act & Assert
            await expect(candidateService.addCandidate(candidateData))
                .rejects
                .toThrow(dbError.message);
        });

        test('should rollback candidate creation if education save fails', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                educations: [{
                    institution: 'University',
                    title: 'Computer Science',
                    startDate: '2020-01-01',
                    endDate: '2024-01-01'
                }]
            };
        
            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };
        
            const educationError = new Error('Failed to save education');
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));
        
            (Education as jest.MockedClass<typeof Education>).mockImplementation((data: any) => ({
                ...data,
                save: jest.fn().mockRejectedValue(educationError)
            }));
        
            // Act & Assert
            await expect(candidateService.addCandidate(candidateData))
                .rejects
                .toThrow(educationError.message);
        });

        test('should rollback candidate creation if work experience save fails', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                workExperiences: [{
                    company: 'Tech Corp',
                    position: 'Developer',
                    startDate: '2020-01-01',
                    endDate: '2024-01-01'
                }]
            };
        
            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };
        
            const workExperienceError = new Error('Failed to save work experience');
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));
        
            (WorkExperience as jest.MockedClass<typeof WorkExperience>).mockImplementation((data: any) => ({
                ...data,
                save: jest.fn().mockRejectedValue(workExperienceError)
            }));
        
            // Act & Assert
            await expect(candidateService.addCandidate(candidateData))
                .rejects
                .toThrow(workExperienceError.message);
        });

        test('should create a candidate with CV', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                cv: {
                    filePath: '/path/to/cv.pdf',
                    fileType: 'application/pdf'
                }
            };
        
            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };
        
            const mockSavedResume = {
                id: 1,
                candidateId: 1,
                ...candidateData.cv
            };
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));
        
            (Resume as jest.MockedClass<typeof Resume>).mockImplementation((data: any) => ({
                ...data,
                save: jest.fn().mockResolvedValue(mockSavedResume)
            }));
        
            // Act
            const result = await candidateService.addCandidate(candidateData);
        
            // Assert
            expect(result).toEqual(mockSavedCandidate);
            expect(Candidate).toHaveBeenCalledWith(candidateData);
            expect(Resume).toHaveBeenCalledWith(candidateData.cv);
        });

        test('should rollback candidate creation if CV save fails', async () => {
            // Arrange
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                cv: {
                    filePath: '/path/to/cv.pdf',
                    fileType: 'application/pdf'
                }
            };
        
            const mockSavedCandidate = {
                id: 1,
                ...candidateData
            };
        
            const resumeError = new Error('Failed to save CV');
        
            (Candidate as jest.MockedClass<typeof Candidate>).mockImplementation((data: any) => ({
                id: data.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                education: [],
                workExperience: [],
                resumes: [],
                save: jest.fn().mockResolvedValue(mockSavedCandidate)
            }));
        
            (Resume as jest.MockedClass<typeof Resume>).mockImplementation((data: any) => ({
                ...data,
                save: jest.fn().mockRejectedValue(resumeError)
            }));
        
            // Act & Assert
            await expect(candidateService.addCandidate(candidateData))
                .rejects
                .toThrow(resumeError.message);
        });
    });
});

describe('Candidate Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockCandidateService: jest.SpyInstance;

    beforeEach(() => {
        mockRequest = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
            }
        } as Partial<Request>;
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        } as Partial<Response>;
        
        mockCandidateService = jest.spyOn(CandidateService.prototype, 'addCandidate');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return 201 when candidate is created successfully', async () => {
        // Arrange
        const mockSavedCandidate = { id: 1, ...mockRequest.body };
        mockCandidateService.mockResolvedValueOnce(mockSavedCandidate);

        // Act
        await addCandidateController(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: 'Candidate added successfully',
            data: mockSavedCandidate
        });
    });

    test('should return 400 when validation fails', async () => {
        // Arrange
        const validationError = new Error('Invalid name');
        mockCandidateService.mockRejectedValueOnce(validationError);
    
        // Act
        await addCandidateController(mockRequest as Request, mockResponse as Response);
    
        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: 'Error adding candidate',
            error: validationError.message
        });
    });

    test('should return 500 when an unexpected error occurs', async () => {
        // Arrange
        const unexpectedError = new Error('Internal server error');
        mockCandidateService.mockRejectedValueOnce(unexpectedError);
    
        // Act
        await addCandidateController(mockRequest as Request, mockResponse as Response);
    
        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: 'Internal server error',
            error: unexpectedError.message
        });
    });
});