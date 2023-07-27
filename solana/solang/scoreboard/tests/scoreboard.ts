import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { Scoreboard } from "../target/types/scoreboard";


function randomPointsGenerator(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

describe("Scoreboard", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Scoreboard as Program<Scoreboard>;
  const wallet = provider.wallet;
  const walletSeed = wallet.publicKey.toBuffer();
  const [dataAccount, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("seed"),
      walletSeed
    ],
    program.programId
  );

  it("Test 1 - Is initialized!", async () => {
    const tx = await program.methods.new(walletSeed, [bump], dataAccount)
      .accounts({
        dataAccount,
      })
      .rpc();
    const score = await program.methods.getCurrentScore()
      .accounts({ dataAccount })
      .view();
    expect(score.toNumber()).to.equal(0);
  });
  it("Test 2 - Adds points!", async () => {
    const pointsToAdd = randomPointsGenerator();
    await program.methods.addPoints(pointsToAdd)
      .accounts({ dataAccount })
      .rpc();
    const score = await program.methods.getCurrentScore()
      .accounts({ dataAccount })
      .view();
    expect(score.toNumber()).to.equal(pointsToAdd);
  });
  it("Test 3 - Resets and checks high score!", async () => {
    const initialScore = (await program.methods.getCurrentScore()
      .accounts({ dataAccount })
      .view()).toNumber();

    const pointsToAdd = randomPointsGenerator();
    await program.methods.addPoints(pointsToAdd)
      .accounts({ dataAccount })
      .rpc();


    await program.methods.resetScore()
      .accounts({ dataAccount })
      .rpc();

    const updatedScore = await program.methods.getCurrentScore()
      .accounts({ dataAccount })
      .view();
    expect(updatedScore.toNumber()).to.equal(0);

    const highScore = await program.methods.getHighScore()
      .accounts({ dataAccount })
      .view();
    expect(highScore.toNumber()).to.equal(initialScore + pointsToAdd);
  });
  it("Test 4 - Is unable to reinitialize!", async () => {
    try {
      await program.methods.new(walletSeed, [bump], dataAccount)
        .accounts({
          dataAccount,
        })
        .rpc();
      assert.fail("Expected an error to be thrown.");
    } catch (error) {
      assert.include(error.message, "program error");
    }
  });
  it("Test 5 - Is unable to add negative points!", async () => {
    try {
      await program.methods.addPoints(-1)
        .accounts({ dataAccount })
        .rpc();
      assert.fail("Expected an error to be thrown.");
    } catch (error) {
      assert.include(error.message, "out of range");
    }
  });
  it("Test 6 - Is unable to add more than 100 points!", async () => {
    try {
      await program.methods.addPoints(2201)
        .accounts({ dataAccount })
        .rpc();
      assert.fail("Expected an error to be thrown.");
    } catch (error) {
      assert.include(error.message, "out of range");
    }
    try {
      await program.methods.addPoints(201)
        .accounts({ dataAccount })
        .rpc();
      assert.fail("Expected an error to be thrown.");
    } catch (error) {
      assert.include(error.message, "program error");
    }
  });
  it("Test 7 - Initializes a new account!", async () => {
    const newUser = anchor.web3.Keypair.generate();
    const newUserSeed = newUser.publicKey.toBuffer();
    const [newUserAccount, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("seed"),
        newUserSeed
      ],
      program.programId
    );

    const tx = await program.methods.new(newUserSeed, [bump], newUserAccount)
      .accounts({
        dataAccount: newUserAccount,
        
      })
      .rpc();
    const score = await program.methods.getCurrentScore()
      .accounts({ dataAccount: newUserAccount })
      .view();
    expect(score.toNumber()).to.equal(0);
  });
});