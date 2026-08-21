import { expect } from "chai";
import fc from "fast-check";
import { ethers } from "ethers";

describe("Identity reference property checks", function () {
  it("derives deterministic non-zero fixed-size hashes for arbitrary non-empty identifiers", function () {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 256 }), (identifier) => {
        const encoded = ethers.toUtf8Bytes(identifier);
        const firstHash = ethers.keccak256(encoded);
        const secondHash = ethers.keccak256(encoded);

        expect(firstHash).to.equal(secondHash);
        expect(firstHash).to.match(/^0x[0-9a-f]{64}$/);
        expect(firstHash).not.to.equal(ethers.ZeroHash);
      }),
      { numRuns: 100 },
    );
  });
});
