use anchor_lang::prelude::*;
use anchor_lang::solana_program::{sysvar, sysvar::instructions::get_instruction_relative};
use std::mem::size_of;

declare_id!("4f3rZyG62cMfHeBLteSn8fWUnTLnSdtiYrGQdiL8wYx3");

// NOTE: this is just example contract that can be called from gateway in execute function for testing withdraw and call
#[program]
pub mod connected {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn on_call(
        ctx: Context<OnCall>,
        amount: u64,
        sender: [u8; 20],
        data: Vec<u8>,
    ) -> Result<()> {
        // NOTE: this is an illustration how connected programs can check if caller is gateway
        // it is up to connected programs to configure sysvar account in remaining_accounts
        // same approach can be used on on_revert and SPL connected programs
        let current_ix = get_instruction_relative(
            0,
            &ctx.accounts.instruction_sysvar_account.to_account_info(),
        )
        .unwrap();

        msg!(
            "on_call invoked by: {}, gateway is {}",
            current_ix.program_id,
            gateway::ID
        );

        require!(
            current_ix.program_id == gateway::ID,
            ErrorCode::InvalidCaller
        );

        let pda = &mut ctx.accounts.pda;

        // Store the sender's public key
        pda.last_sender = sender;

        // Convert data to a string and store it
        let message = String::from_utf8(data).map_err(|_| ErrorCode::InvalidDataFormat)?;
        pda.last_message = message;

        // Split the half equally among all remaining_accounts and pda
        let half = amount / 2;
        let rem_accounts_len = ctx.remaining_accounts.len() as u64;
        if rem_accounts_len > 0 {
            let share = half / rem_accounts_len;
            let mut shares_sum = 0;
            for acc in ctx.remaining_accounts.iter() {
                acc.add_lamports(share)?;
                shares_sum += share;
            }
            pda.sub_lamports(shares_sum)?;
        }

        if pda.last_message.contains("revert") {
            msg!(
                "Reverting transaction due to message: '{}'",
                pda.last_message
            );
            return Err(ErrorCode::RevertMessage.into());
        }

        msg!(
            "On call executed with amount {}, sender {:?} and message {}",
            amount,
            pda.last_sender,
            pda.last_message
        );

        Ok(())
    }

    pub fn on_revert(
        ctx: Context<OnRevert>,
        amount: u64,
        sender: Pubkey,
        data: Vec<u8>,
    ) -> Result<()> {
        let pda = &mut ctx.accounts.pda;

        // Store the sender's public key
        pda.last_revert_sender = sender;

        // Convert data to a string and store it
        let message = String::from_utf8(data).map_err(|_| ErrorCode::InvalidDataFormat)?;
        pda.last_revert_message = message;

        // Transfer some portion of lamports transferred from gateway to another account
        // Check if the message contains "revert" and return an error if so
        if pda.last_revert_message.contains("revert") {
            msg!(
                "Reverting transaction due to message: '{}'",
                pda.last_revert_message
            );
            return Err(ErrorCode::RevertMessage.into());
        }

        msg!(
            "On revert executed with amount {}, sender {:?} and message {}",
            amount,
            pda.last_revert_sender,
            pda.last_revert_message
        );

        Ok(())
    }

    pub fn trigger_deposit(
        ctx: Context<TriggerDeposit>,
        amount: u64,
        receiver: [u8; 20],
        revert_options: Option<gateway::RevertOptions>,
    ) -> Result<()> {
        let gateway_program = ctx.accounts.gateway_program.to_account_info();

        let cpi_accounts = gateway::cpi::accounts::Deposit {
            signer: ctx.accounts.signer.to_account_info(),
            pda: ctx.accounts.gateway_pda.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        let cpi_program = gateway_program;
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        gateway::cpi::deposit(cpi_ctx, amount, receiver, revert_options)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(init, payer = signer, space = size_of::<Pda>() + 32, seeds = [b"connected"], bump)]
    pub pda: Account<'info, Pda>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OnCall<'info> {
    #[account(mut, seeds = [b"connected"], bump)]
    pub pda: Account<'info, Pda>,

    /// CHECK: This is test program.
    pub gateway_pda: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: This is test program.
    #[account(address = sysvar::instructions::id())]
    instruction_sysvar_account: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct OnRevert<'info> {
    #[account(mut, seeds = [b"connected"], bump)]
    pub pda: Account<'info, Pda>,

    /// CHECK: This is test program.
    pub gateway_pda: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TriggerDeposit<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    /// CHECK: Validated by the gateway program via seeds
    pub gateway_pda: UncheckedAccount<'info>,

    /// CHECK: Only used for CPI
    pub gateway_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pda {
    pub last_sender: [u8; 20],
    pub last_message: String,
    pub last_revert_sender: Pubkey,
    pub last_revert_message: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The data provided could not be converted to a valid UTF-8 string.")]
    InvalidDataFormat,

    #[msg("Revert message detected. Transaction execution halted.")]
    RevertMessage,

    #[msg("Caller is not the gateway program.")]
    InvalidCaller,
}