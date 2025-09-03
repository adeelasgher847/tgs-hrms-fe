# Backend Team API Suggestions

## Missing Endpoints for Complete Team CRUD

The frontend now has complete CRUD functionality for teams, but the backend needs these additional endpoints:

### 1. Get Available Managers Endpoint

**Endpoint:** `GET /api/teams/available-managers`

**Purpose:** Get all users with 'manager' role who are not currently assigned to any team

**Response:**
```json
[
  {
    "id": "user-id",
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john.doe@example.com",
    "role": "manager"
  }
]
```

**Backend Implementation:**
```typescript
// In TeamController
@Get('available-managers')
@Roles('admin', 'system-admin')
async getAvailableManagers() {
  return this.teamService.getAvailableManagers();
}

// In TeamService
async getAvailableManagers(): Promise<Manager[]> {
  // Get all users with manager role who are not assigned to any team
  const managers = await this.userRepository
    .createQueryBuilder('user')
    .leftJoin('user.role', 'role')
    .leftJoin('team', 'team', 'team.manager_id = user.id')
    .where('role.name = :role', { role: 'manager' })
    .andWhere('team.id IS NULL')
    .select(['user.id', 'user.first_name', 'user.last_name', 'user.email'])
    .getMany();

  return managers.map(user => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: 'manager'
  }));
}
```

### 2. Update Team Endpoint (if not exists)

**Endpoint:** `PATCH /api/teams/:id`

**Purpose:** Update team details (name, description, manager)

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "manager_id": "new-manager-id"
}
```

**Backend Implementation:**
```typescript
// In TeamController
@Patch(':id')
@Roles('admin', 'system-admin')
async updateTeam(
  @Param('id') id: string,
  @Body() updateTeamDto: UpdateTeamDto,
  @TenantId() tenantId: string
) {
  return this.teamService.updateTeam(id, updateTeamDto, tenantId);
}

// In TeamService
async updateTeam(id: string, updateTeamDto: UpdateTeamDto, tenantId: string): Promise<Team> {
  const team = await this.teamRepository.findOne({
    where: { id, tenant_id: tenantId },
    relations: ['manager']
  });

  if (!team) {
    throw new NotFoundException('Team not found');
  }

  // If manager is being changed, verify the new manager exists and is available
  if (updateTeamDto.manager_id && updateTeamDto.manager_id !== team.manager_id) {
    const newManager = await this.userRepository.findOne({
      where: { id: updateTeamDto.manager_id, tenant_id: tenantId },
      relations: ['role']
    });

    if (!newManager || newManager.role.name !== 'manager') {
      throw new BadRequestException('Invalid manager selected');
    }

    // Check if new manager is already assigned to another team
    const existingTeam = await this.teamRepository.findOne({
      where: { manager_id: updateTeamDto.manager_id }
    });

    if (existingTeam && existingTeam.id !== id) {
      throw new BadRequestException('Manager is already assigned to another team');
    }
  }

  Object.assign(team, updateTeamDto);
  return this.teamRepository.save(team);
}
```

### 3. Delete Team Endpoint (if not exists)

**Endpoint:** `DELETE /api/teams/:id`

**Purpose:** Delete a team and remove all team members

**Backend Implementation:**
```typescript
// In TeamController
@Delete(':id')
@Roles('admin', 'system-admin')
async deleteTeam(
  @Param('id') id: string,
  @TenantId() tenantId: string
) {
  return this.teamService.deleteTeam(id, tenantId);
}

// In TeamService
async deleteTeam(id: string, tenantId: string): Promise<void> {
  const team = await this.teamRepository.findOne({
    where: { id, tenant_id: tenantId },
    relations: ['teamMembers']
  });

  if (!team) {
    throw new NotFoundException('Team not found');
  }

  // Remove all team members first
  if (team.teamMembers && team.teamMembers.length > 0) {
    await this.teamMemberRepository.remove(team.teamMembers);
  }

  // Delete the team
  await this.teamRepository.remove(team);
}
```

### 4. Enhanced Create Team Endpoint

**Current endpoint should be enhanced to:**
- Validate that the selected manager has 'manager' role
- Check that the manager is not already assigned to another team
- Return proper error messages

```typescript
// In TeamService
async createTeam(createTeamDto: CreateTeamDto, tenantId: string): Promise<Team> {
  // Validate manager exists and has manager role
  const manager = await this.userRepository.findOne({
    where: { id: createTeamDto.manager_id, tenant_id: tenantId },
    relations: ['role']
  });

  if (!manager) {
    throw new NotFoundException('Manager not found');
  }

  if (manager.role.name !== 'manager') {
    throw new BadRequestException('Selected user is not a manager');
  }

  // Check if manager is already assigned to another team
  const existingTeam = await this.teamRepository.findOne({
    where: { manager_id: createTeamDto.manager_id }
  });

  if (existingTeam) {
    throw new BadRequestException('Manager is already assigned to another team');
  }

  const team = this.teamRepository.create({
    ...createTeamDto,
    tenant_id: tenantId
  });

  return this.teamRepository.save(team);
}
```

## Required Database Changes

### 1. Team Entity
```typescript
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  manager_id: string;

  @Column()
  tenant_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => TeamMember, teamMember => teamMember.team, { cascade: true })
  teamMembers: TeamMember[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### 2. TeamMember Entity
```typescript
@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  team_id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

## Frontend Integration Notes

1. **Manager Dropdown**: Now loads actual managers from API
2. **Edit Team**: Full form with pre-populated data
3. **Delete Team**: Proper confirmation dialog with team details
4. **Real-time Updates**: All operations trigger data refresh
5. **Error Handling**: Proper error messages and validation

## Testing Checklist

- [ ] Create team with valid manager
- [ ] Create team with invalid manager (should fail)
- [ ] Create team with manager already assigned (should fail)
- [ ] Edit team name and description
- [ ] Edit team manager (should validate new manager)
- [ ] Delete team (should remove all members)
- [ ] Manager dropdown shows only available managers
- [ ] Admin can see all teams
- [ ] Manager can only see their teams
- [ ] Proper error messages for all scenarios
