import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../domain/users/user.repository';
import { OrganizationUserRepository } from '../../../domain/organizations/organization-user.repository';
import { ProjectUserRepository } from '../../../domain/projects/project-user.repository';
import { SequenceService } from '../../../infrastructure/persistence/mongoose/services/sequence.service';
import { QueueTaskProcessor } from '../../workers/processors/queue-task.processor';
import { EnsurePokUserUseCase } from '../../../application/users/use-cases/ensure-user.usecase'; // ajustá path real
import { ConfigService } from '@nestjs/config';
import { PokService } from '../../../infrastructure/integrations/pok/pok.service';
import { EvidenceRepository } from '../../../domain/evidences/evidence.repository';
import { CreateEvidenceUseCase} from '../../../application/evidences/use-cases/create-evidence.usecase';
import { CreateProjectUserUseCase } from '../../../application/projects/use-cases/create-project-user.usecase';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PokTitlesSyncProcessor implements QueueTaskProcessor {
  type = 'POK_TITLES_SYNC';

  constructor(
    private readonly ensurePokUser: EnsurePokUserUseCase,
    private readonly config: ConfigService,
    private readonly users: UserRepository,
    private readonly orgUsers: OrganizationUserRepository,
    private readonly seq: SequenceService,
    private readonly pok: PokService,
    private readonly createEvidence: CreateEvidenceUseCase,
    //private readonly filesClient: TitlesFileClient,
    //private readonly evidenceSync: EvidenceSyncService, // tu flujo existente
    private readonly evidenceRepo: EvidenceRepository, // para idempotencia por vcHash
    private readonly proyUserUC: CreateProjectUserUseCase,
    private readonly proyUserRepo: ProjectUserRepository,
  ) {}


async process(task: { payload: any }) {

  const { projectId, phaseId, holder, vc } = task.payload;

  const email = holder?.email;
  const fullName = holder?.name ?? null;
  const vcId = vc?.id;

  if (!projectId || ! phaseId || !email || !vcId) {
    throw new Error('INVALID_TASK_PAYLOAD');
  }

  const file_name = `${projectId}-${phaseId}-${vcId}`;


  const existing = await this.evidenceRepo.findByProjectAndFileName(projectId, file_name);
  if (existing?.uri && existing?.tx_hash) {
    return { skipped: true, id_evidence: existing.id_evidence };
  }

  const user = await this.ensurePokUser.execute({
    email,
    fullName,
  });


  const projUsers = await this.proyUserRepo.findAll({projectId});

  const alreadyMember = projUsers?.find((item) => item.id_user === user.id_user);

  if (!alreadyMember){
       await this.proyUserUC.executeMany(projectId,[{'id_user':user.id_user}]);
  } 

  console.log("DOWNLOAD CREDENTIAL",vcId);
  const { buffer, contentType } = await this.pok.downloadDecryptedImage(vcId);

  console.log("WRITE IN UPLOAD FOLDER");
  const uploadsDir = path.resolve('./uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const localPath = path.join(uploadsDir, file_name);
 
  //fs.writeFileSync(localPath, Buffer.from(buffer));
  fs.writeFileSync(localPath, buffer);

  try {
    console.log("CREATE EVIDENCE AND UPLOAD CREDENTIAL TO GCP");
    const evidence = await this.createEvidence.execute({
      id_project:projectId,
      id_user: user.id_user,
      id_phase_project:phaseId,
      file: {
        filename: file_name,
        originalname: file_name,
        path: localPath,
        mimetype: contentType,
        size: buffer.length,
        //size: Buffer.byteLength(buffer),
      } as any,
      destinationPath: projectId,
    });

    return { ok: true, id_evidence: evidence.id_evidence };
  } catch(e) {
     console.log("ERROR CREATE EVIDENCE AND UPLOAD TO GCP",e);
  }
  finally {

    try { fs.unlinkSync(localPath); } catch {}
  }


  }

}


/*   async process(task: { payload: any }) {
    const { email, vc,id_project } = task.payload;
    // ✅ 1) ensure user (idempotente)
    // Si en payload también tenés el nombre, usalo:
    // const fullName = task.payload?.name ?? task.payload?.holder?.name ?? null;
    // const user = await this.ensurePokUser.execute({ email, fullName });
    const user = await this.ensurePokUser.execute({
      email,
      fullName: vc?.receiver?.name ?? null, // si viene el nombre dentro de vc
      // id_organization: 'org_001', // opcional si querés forzar acá (yo lo dejaría adentro del usecase con config)
    });
    const baseName = `pok-${id_project}-${vc.id}`;
    const existing = await this.evidenceRepo.findByProjectAndFileName(id_project, baseName);
    if (existing?.uri && existing?.tx_hash) {
      return { skipped: true, id_evidence: existing.id_evidence };
    }
    const { buffer, contentType } = await this.pokSrv.downloadDecryptedImage(vc.id);
    const ext = this.guessExtension(contentType) ?? '.bin';
    const file_name = `${baseName}${ext}`;
    // --- lo tuyo comentado queda igual ---
    // si ya existe evidencia por vcHash -> skip
    // const ex = await this.evidenceRepo.findByVcHash(vcHash);
    // if (ex?.fileUri && ex?.txHash) return { skipped: true, ... };
    //const file = await this.filesClient.download(externalRef); // stream + contentType
    // tu método real (adaptá firma)
    /* return this.evidenceSync.uploadTitleEvidence({
      id_user: user.id_user,
      vcHash,
      externalRef,
      vc,
      contentType: file.contentType,
      stream: file.stream,
    }); 
  } */