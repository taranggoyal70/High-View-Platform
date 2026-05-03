import { motion } from 'framer-motion'
import { Shield, Lock, Server, Eye, Trash2, FileCheck, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const pillars = [
  {
    icon: Server,
    title: 'Fully Local Processing',
    description:
      'All face recognition and audio transcription runs on your institution\'s hardware. No student video, photo, or biometric data is ever transmitted to external servers.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Lock,
    title: 'Biometrics Never Leave Campus',
    description:
      'Face encodings — the mathematical vectors derived from student photos — are stored only on your local server. They cannot be reverse-engineered into photos and are deleted on request.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Eye,
    title: 'We Cannot See Your Data',
    description:
      'Studentlytics has no remote access to your server. We see anonymized aggregate usage statistics only (videos processed, processing time). Never individual student records.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Trash2,
    title: 'Full Data Deletion',
    description:
      'Delete the software directory and all data is gone — photos, encodings, results. Nothing persists on our end. We also provide one-click deletion per student from the admin dashboard.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
]

const regulations = [
  {
    name: 'FERPA',
    region: 'United States',
    status: 'Compliant',
    detail:
      'All student attendance records remain under institutional control. Studentlytics operates as a school official under FERPA\'s legitimate educational interest exception.',
  },
  {
    name: 'BIPA',
    region: 'Illinois, USA',
    status: 'Compliant with consent',
    detail:
      'We provide a written consent form template for institutions. Biometric identifiers (face encodings) are stored on-premises only. We do not profit from biometric data.',
  },
  {
    name: 'GDPR',
    region: 'EU / UK',
    status: 'Compliant',
    detail:
      'No personal data crosses jurisdictional boundaries. We act as a data processor under your control. Data Processing Agreement available on request.',
  },
  {
    name: 'COPPA',
    region: 'United States',
    status: 'Higher Ed only',
    detail:
      'Studentlytics is designed for higher education (18+ students). We do not operate in K-12 environments.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy & Compliance</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Studentlytics was built with a single architectural constraint: student biometric data
            never leaves your institution's network.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {pillars.map((p) => (
            <Card key={p.title}>
              <CardContent className="pt-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${p.bg} mb-4`}>
                  <p.icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What Data We Process */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Data We Process — And Where It Lives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold">Data Type</th>
                    <th className="text-left py-2 pr-4 font-semibold">Location</th>
                    <th className="text-left py-2 font-semibold">External?</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ['Student enrollment photos', 'Your local server', false],
                    ['Face encodings (128-dim vectors)', 'Your local server', false],
                    ['Classroom video recordings', 'Your local server', false],
                    ['Audio transcripts', 'Your local server', false],
                    ['Attendance + engagement results', 'Your local server', false],
                    ['Anonymized usage stats', 'Studentlytics analytics', true],
                  ].map(([type, location, external]) => (
                    <tr key={type as string}>
                      <td className="py-2 pr-4">{type as string}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{location as string}</td>
                      <td className="py-2">
                        {external ? (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Aggregate only</span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-700 text-xs">
                            <CheckCircle className="h-3 w-3" /> Local only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Compliance */}
        <h2 className="text-2xl font-bold mb-4">Regulatory Compliance</h2>
        <div className="space-y-4 mb-12">
          {regulations.map((r) => (
            <Card key={r.name}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.region}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    {r.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Consent */}
        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Student Consent Requirement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Before enrolling any student in face recognition, institutions must:
            </p>
            <ul className="space-y-2">
              {[
                'Notify students that classroom attendance will be tracked using face recognition',
                'Obtain written or digital consent from each student before their photo is enrolled',
                'Provide an opt-out method — students who decline must have an alternative attendance option',
                'Inform students of their right to access or delete their biometric data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="pt-2 text-muted-foreground">
              We provide a consent form template, student notice email template, and opt-out tracking
              in the enrollment dashboard. Contact us for BIPA-specific consent documentation.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Compliance Questions?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            We provide Data Processing Agreements (DPA), FERPA certifications, and BIPA compliance
            documentation for institutional procurement.
          </p>
          <a
            href="mailto:privacy@studentlytics.ai"
            className="text-primary font-medium hover:underline"
          >
            privacy@studentlytics.ai
          </a>
        </div>
      </motion.div>
    </div>
  )
}
