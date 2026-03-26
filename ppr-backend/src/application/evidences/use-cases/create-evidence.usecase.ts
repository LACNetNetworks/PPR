import { Injectable } from '@nestjs/common';
import type { Express } from 'express';
import { EvidenceRepository } from '../../../domain/evidences/evidence.repository';
import { Evidence } from '../../../domain/evidences/evidence.entity';
import { GcpUploadClient } from '../../../infrastructure/integrations/storage/gcp-upload.client';
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { EvidenceBlockchainPort } from '../../integrations/ports/evidence.blockchain.port';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { EvidenceStatus } from '../../../domain/evidences/evidence-status.enum';

function ensureBytes32(input: string) {
  if (input.startsWith('0x') && input.length === 66) return input;
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}



@Injectable()
export class CreateEvidenceUseCase {
  constructor(private readonly evidenceRepo: EvidenceRepository,
              private readonly gcpUpload: GcpUploadClient,
              private readonly seq: SequenceService,
              private readonly chain: EvidenceBlockchainPort,
              private readonly cfg: ConfigService,
  ) {}

  async execute(input: {
    id_project: string;
    id_user: string;
    file: Express.Multer.File; 
    destinationPath?: string;
    id_phase_project?: string;
    id_phase_project_task?: string;
  }): Promise<Evidence> {

    const nextNumber = await this.seq.next('evidences');
    const id_evidence = `evd_${String(nextNumber).padStart(3, '0')}`;

    const remotePath = input.destinationPath ?? input.id_project;
    const file_name = input.file.filename;        
     console.log("NOMBRE DE ARCHIVO EN UPLOADEVIDENCE",file_name);          
    const uploaded = await this.gcpUpload.uploadLocalFile(
      input.file.path,
      remotePath,          
      input.file.filename,
      input.file.mimetype,
      true,              
    );

    console.log("UPLOADED",uploaded);
    const docHash = ensureBytes32(uploaded.raw?.files?.[0]?.filename || uploaded.uri || input.file.filename);
    const uidHash = ensureBytes32(input.id_user); 

   
    const address = this.cfg.get<string>('blockchain.address_contract')!; 
    const tx = await this.chain.addDoc(address, docHash, uidHash);


    const entity = new Evidence(
      id_evidence,
      input.id_project,
      input.id_user,
      file_name,
      uploaded.uri,
      EvidenceStatus.CREATED,
      tx.res,      
      new Date(),
      input.id_phase_project,
      input.id_phase_project_task,
    );

    await this.evidenceRepo.save(entity);
    return entity;
  }
}